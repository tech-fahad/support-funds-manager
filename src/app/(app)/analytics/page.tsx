import { prisma } from "@/lib/prisma"
import { formatPKR } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BalanceChart } from "@/components/analytics/balance-chart"
import { ContributionsPayoutsChart } from "@/components/analytics/contributions-payouts-chart"
import { MemberBreakdownChart } from "@/components/analytics/member-breakdown-chart"
import { ComplianceChart } from "@/components/analytics/compliance-chart"
import { MEMBER_PAYOUT_AMOUNT } from "@/lib/constants"

export default async function AnalyticsPage() {
  const [reports, memberCounts, complianceData] = await Promise.all([
    prisma.monthlyReport.findMany({ orderBy: { month: "asc" } }),
    prisma.member.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.contribution.groupBy({
      by: ["month", "status"],
      _count: { id: true },
      orderBy: { month: "asc" },
    }),
  ])

  const activeMembers = memberCounts
    .filter((m: { role: string }) => ["member", "trustee", "office_staff"].includes(m.role))
    .reduce((sum: number, m: { _count: { id: number } }) => sum + m._count.id, 0)

  const suspendedCount = memberCounts
    .find((m: { role: string }) => m.role === "suspended")?._count.id ?? 0

  const inQueue = await prisma.claim.count({ where: { status: "waiting" } })
  const receiving = await prisma.claim.count({ where: { status: "active" } })

  const latestReport = reports[reports.length - 1]
  const balance = latestReport?.balance ?? 0
  const runwayMonths = balance > 0 ? Math.floor(balance / MEMBER_PAYOUT_AMOUNT) : 0

  // Transform compliance data
  const monthsMap: Record<string, { month: string; on_time: number; late: number; missed: number }> = {}
  for (const row of complianceData) {
    if (!monthsMap[row.month]) monthsMap[row.month] = { month: row.month, on_time: 0, late: 0, missed: 0 }
    monthsMap[row.month][row.status as "on_time" | "late" | "missed"] = row._count.id
  }
  const complianceChartData = Object.values(monthsMap)

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Hero stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile title="Fund Balance" value={formatPKR(balance)} />
        <StatTile title="Runway" value={`${runwayMonths} months`} sub="payout capacity" />
        <StatTile title="Active Members" value={String(activeMembers)} />
        <StatTile title="Suspended" value={String(suspendedCount)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatTile title="In Queue" value={String(inQueue)} />
        <StatTile title="Receiving Help" value={String(receiving)} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Fund Balance Over Time</CardTitle></CardHeader>
          <CardContent>
            <BalanceChart data={reports.map((r) => ({ month: r.month, balance: r.balance }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contributions vs Payouts</CardTitle></CardHeader>
          <CardContent>
            <ContributionsPayoutsChart
              data={reports.map((r) => ({ month: r.month, in: r.totalIn, out: r.totalOut }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Member Breakdown</CardTitle></CardHeader>
          <CardContent>
            <MemberBreakdownChart
              data={[
                { name: "Active", value: activeMembers },
                { name: "Suspended", value: suspendedCount },
                { name: "In Queue", value: inQueue },
                { name: "Receiving", value: receiving },
              ].filter((d) => d.value > 0)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contribution Compliance</CardTitle></CardHeader>
          <CardContent>
            <ComplianceChart data={complianceChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatTile({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
