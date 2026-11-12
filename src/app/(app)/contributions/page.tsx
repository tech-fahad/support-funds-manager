import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatMonth, formatPKR, currentMonth } from "@/lib/format"
import { AlertCircle } from "lucide-react"

export default async function ContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    include: { contributions: { orderBy: { month: "desc" } } },
  })

  if (!member) redirect("/onboarding")

  const thisMonth = currentMonth()
  const thisMonthPaid = member.contributions.some(
    (c: { month: string; status: string }) =>
      c.month === thisMonth && c.status !== "missed"
  )

  const missedCount = member.contributions.filter(
    (c: { status: string }) => c.status === "missed"
  ).length

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Contributions</h1>

      {!thisMonthPaid && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Payment due for {formatMonth(thisMonth)}</p>
            <p className="text-destructive/80 mt-0.5">
              PKR 10,000 is due by the 5th. Payments up to the 10th are accepted on time.
            </p>
          </div>
        </div>
      )}

      {missedCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            You have <strong>{missedCount}</strong> missed payment{missedCount > 1 ? "s" : ""}.
            {missedCount >= 2 && " Your account has been suspended."}
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {member.contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No contributions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.contributions.map((c: {
                  id: string; month: string; amount: number;
                  paidAt: Date | null; status: string; recordedById: string | null
                }) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatMonth(c.month)}</TableCell>
                    <TableCell>{formatPKR(c.amount)}</TableCell>
                    <TableCell>{c.paidAt ? formatDate(c.paidAt) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {c.recordedById ? "Trustee" : "Self"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        c.status === "on_time" ? "default" :
                        c.status === "late" ? "secondary" : "destructive"
                      }>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
