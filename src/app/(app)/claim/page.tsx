import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatPKR } from "@/lib/format"
import { ClaimForm } from "@/components/claims/claim-form"
import { MEMBER_PAYOUT_AMOUNT, STAFF_PAYOUT_AMOUNT } from "@/lib/constants"

export default async function ClaimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    include: {
      claims: {
        orderBy: { createdAt: "desc" },
        include: { payouts: true },
      },
    },
  })

  if (!member) redirect("/onboarding")

  const activeClaim = member.claims.find(
    (c: { status: string }) => !["rejected", "closed", "completed"].includes(c.status)
  )

  const payoutAmount = member.role === "office_staff" ? STAFF_PAYOUT_AMOUNT : MEMBER_PAYOUT_AMOUNT

  const statusDescriptions: Record<string, string> = {
    pending: "Your claim is under review by trustees.",
    approved: "Your claim has been approved. You have been added to the queue.",
    waiting: "You are on the waiting list. Payments begin when it's your turn.",
    active: "You are currently receiving help.",
    completed: "Your payout is complete.",
    rejected: "Your claim was not approved.",
    closed: "Your claim has been closed.",
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">My Claim</h1>

      {activeClaim ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Claim</CardTitle>
              <Badge>{activeClaim.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Type" value={activeClaim.type.replace("_", " ")} />
            <Row label="Notice date" value={formatDate(activeClaim.noticeDate)} />
            <Row label="Notice period ends" value={formatDate(activeClaim.noticePeriodEndDate)} />
            {activeClaim.queuePosition && (
              <Row label="Queue position" value={`#${activeClaim.queuePosition}`} />
            )}
            {activeClaim.queueEnteredAt && (
              <Row label="Queue since" value={formatDate(activeClaim.queueEnteredAt)} />
            )}
            <p className="text-muted-foreground pt-1">{statusDescriptions[activeClaim.status]}</p>

            {activeClaim.payouts.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="font-medium">Payouts</p>
                {activeClaim.payouts.map((p: {
                  id: string; monthNumber: number; amount: number; status: string; paidAt: Date | null
                }) => (
                  <div key={p.id} className="flex justify-between">
                    <span className="text-muted-foreground">Month {p.monthNumber}</span>
                    <span>{formatPKR(p.amount)}</span>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.paidAt && <span className="text-muted-foreground">{formatDate(p.paidAt)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground space-y-1">
              <p>If you have been laid off or asked to resign, you can submit a claim.</p>
              <p>You will receive <strong>{formatPKR(payoutAmount)}/month for 2 months</strong> once your claim is approved and it is your turn in the queue.</p>
              <p className="text-destructive">You cannot claim if you have any unpaid contributions.</p>
            </CardContent>
          </Card>
          <ClaimForm memberId={member.id} />
        </div>
      )}

      {member.claims.filter((c: { status: string }) =>
        ["rejected", "closed", "completed"].includes(c.status)
      ).length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Past Claims</p>
          <div className="space-y-2">
            {member.claims
              .filter((c: { status: string }) => ["rejected", "closed", "completed"].includes(c.status))
              .map((c: { id: string; type: string; noticeDate: Date; status: string }) => (
                <Card key={c.id} className="bg-muted/40">
                  <CardContent className="pt-4 pb-4 flex justify-between text-sm">
                    <span>{c.type.replace("_", " ")} · {formatDate(c.noticeDate)}</span>
                    <Badge variant="outline">{c.status}</Badge>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
