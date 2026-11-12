import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPKR, currentMonth } from "@/lib/format"

export default async function TrusteeOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const thisMonth = currentMonth()

  const [
    pendingApprovals,
    pendingClaims,
    inArrears,
    pendingPayouts,
    totalIn,
    totalOut,
  ] = await Promise.all([
    prisma.member.count({ where: { role: "pending" } }),
    prisma.claim.count({ where: { status: "pending" } }),
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: { status: "missed" },
      having: { memberId: { _count: { gte: 1 } } },
    }).then((r) => r.length),
    prisma.payout.count({ where: { status: { in: ["pending", "approved", "transfer_uploaded"] } } }),
    prisma.contribution.aggregate({ _sum: { amount: true }, where: { status: { in: ["on_time", "late"] } } }),
    prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
  ])

  const balance = (totalIn._sum.amount ?? 0) - (totalOut._sum.amount ?? 0)

  const thisMonthContribs = await prisma.contribution.count({
    where: { month: thisMonth, status: { in: ["on_time", "late"] } },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Trustee Overview</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile title="Fund Balance" value={formatPKR(balance)} />
        <StatTile title="Pending Approvals" value={String(pendingApprovals)} urgent={pendingApprovals > 0} />
        <StatTile title="Pending Claims" value={String(pendingClaims)} urgent={pendingClaims > 0} />
        <StatTile title="Pending Payouts" value={String(pendingPayouts)} urgent={pendingPayouts > 0} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatTile title="Members in Arrears" value={String(inArrears)} urgent={inArrears > 0} />
        <StatTile title={`Contributions This Month`} value={String(thisMonthContribs)} />
      </div>
    </div>
  )
}

function StatTile({ title, value, urgent }: { title: string; value: string; urgent?: boolean }) {
  return (
    <Card className={urgent ? "border-destructive/40" : ""}>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-xl font-semibold ${urgent ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
