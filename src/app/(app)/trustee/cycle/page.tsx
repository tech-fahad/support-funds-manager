import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMonth, formatPKR, currentMonth } from "@/lib/format"
import { RunCycleButton } from "@/components/trustee/run-cycle-button"
import { PublishReportButton } from "@/components/trustee/publish-report-button"
import { MEMBER_PAYOUT_AMOUNT, STAFF_PAYOUT_AMOUNT } from "@/lib/constants"

export default async function TrusteeCyclePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const thisMonth = currentMonth()
  const existingReport = await prisma.monthlyReport.findUnique({ where: { month: thisMonth } })

  const [inQueue, receiving, totalIn, totalOut] = await Promise.all([
    prisma.claim.count({ where: { status: "waiting" } }),
    prisma.claim.count({ where: { status: "active" } }),
    prisma.contribution.aggregate({ _sum: { amount: true }, where: { status: { in: ["on_time", "late"] } } }),
    prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
  ])

  const balance = (totalIn._sum.amount ?? 0) - (totalOut._sum.amount ?? 0)
  const canPayMember = balance >= MEMBER_PAYOUT_AMOUNT
  const canPayStaff = balance >= STAFF_PAYOUT_AMOUNT

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Monthly Cycle</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Run on the 5th — calculates payouts. Publish report by the 10th.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{formatMonth(thisMonth)}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Fund balance</p>
              <p className="font-semibold text-lg">{formatPKR(balance)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">In queue</p>
              <p className="font-semibold text-lg">{inQueue}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Receiving help</p>
              <p className="font-semibold text-lg">{receiving}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Can pay member</p>
              <p className={`font-semibold text-lg ${canPayMember ? "text-green-700" : "text-destructive"}`}>
                {canPayMember ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <p className="font-medium mb-1">Step 1 — Run cycle (5th)</p>
              <p className="text-muted-foreground text-xs mb-2">
                Locks the queue, advances active payouts, moves queue to active if balance allows,
                and creates payout records for trustee approval.
              </p>
              <RunCycleButton actorId={me.id} month={thisMonth} />
            </div>

            <div>
              <p className="font-medium mb-1">Step 2 — Approve payouts in Payouts tab</p>
              <p className="text-muted-foreground text-xs">
                Each payout needs 2-of-3 trustee approvals, then upload the transfer document,
                then confirm paid.
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">Step 3 — Publish monthly report (10th)</p>
              <p className="text-muted-foreground text-xs mb-2">
                Publishes the report to all members. This cannot be undone.
              </p>
              <PublishReportButton
                actorId={me.id}
                month={thisMonth}
                alreadyPublished={!!existingReport?.publishedAt}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
