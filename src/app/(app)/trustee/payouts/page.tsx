import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatPKR } from "@/lib/format"
import { PayoutActions } from "@/components/trustee/payout-actions"

export default async function TrusteePayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { name: true } },
      claim: { select: { type: true } },
    },
  })

  const statusColor: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "outline",
    approved: "secondary",
    transfer_uploaded: "secondary",
    paid: "default",
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Approve payouts, upload transfer documents, then confirm payment.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead>Transfer Doc</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">
                    {(payout as { member: { name: string } }).member.name}
                  </TableCell>
                  <TableCell>Month {payout.monthNumber}</TableCell>
                  <TableCell>{formatPKR(payout.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[payout.approvedById1, payout.approvedById2].filter(Boolean).length}/2
                  </TableCell>
                  <TableCell>
                    {payout.transferDocumentUrl ? (
                      <a
                        href={payout.transferDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        View
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{payout.paidAt ? formatDate(payout.paidAt) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor[payout.status]}>
                      {payout.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PayoutActions payout={payout} actorId={me.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
