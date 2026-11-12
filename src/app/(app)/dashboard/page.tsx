import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPKR, formatDate, currentMonth } from "@/lib/format"
import { Users, Wallet, ListOrdered, HandCoins } from "lucide-react"
import { FUND_MINIMUM_BALANCE } from "@/lib/constants"

async function getFundStats() {
  const [activeMembers, inQueue, receiving, totalIn, totalOut] = await Promise.all([
    prisma.member.count({ where: { role: { in: ["member", "trustee", "office_staff"] } } }),
    prisma.claim.count({ where: { status: "waiting" } }),
    prisma.claim.count({ where: { status: "active" } }),
    prisma.contribution.aggregate({ _sum: { amount: true }, where: { status: { in: ["on_time", "late"] } } }),
    prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
  ])
  const balance = (totalIn._sum.amount ?? 0) - (totalOut._sum.amount ?? 0)
  return { balance, activeMembers, inQueue, receiving }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    include: {
      contributions: { orderBy: { month: "desc" }, take: 3 },
      claims: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  if (!member) redirect("/onboarding")

  const stats = await getFundStats()
  const thisMonth = currentMonth()
  const thisMonthContribution = member.contributions.find(
    (c: { month: string }) => c.month === thisMonth
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Welcome back, {member.name}</p>
        {stats.balance < FUND_MINIMUM_BALANCE && (
          <p className="text-sm text-destructive mt-1 font-medium">
            Fund balance is below the PKR 200,000 minimum — payouts are paused.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile title="Fund Balance" value={formatPKR(stats.balance)} icon={<Wallet className="h-4 w-4" />} />
        <StatTile title="Active Members" value={String(stats.activeMembers)} icon={<Users className="h-4 w-4" />} />
        <StatTile title="In Queue" value={String(stats.inQueue)} icon={<ListOrdered className="h-4 w-4" />} />
        <StatTile title="Receiving Help" value={String(stats.receiving)} icon={<HandCoins className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">This Month's Contribution</CardTitle></CardHeader>
        <CardContent>
          {thisMonthContribution ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {formatPKR((thisMonthContribution as { amount: number }).amount)}
                {(thisMonthContribution as { paidAt: Date | null }).paidAt &&
                  ` · paid ${formatDate((thisMonthContribution as { paidAt: Date }).paidAt)}`}
              </span>
              <Badge variant={
                (thisMonthContribution as { status: string }).status === "on_time" ? "default" :
                (thisMonthContribution as { status: string }).status === "late" ? "secondary" : "destructive"
              }>
                {(thisMonthContribution as { status: string }).status.replace("_", " ")}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-destructive font-medium">Not paid yet — due by the 5th</p>
          )}
        </CardContent>
      </Card>

      {member.claims[0] && (
        <Card>
          <CardHeader><CardTitle className="text-base">Claim Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Notice date: {formatDate(member.claims[0].noticeDate)}
              </span>
              <Badge>{member.claims[0].status}</Badge>
            </div>
            {member.claims[0].queuePosition && (
              <p className="text-sm mt-1 text-muted-foreground">
                Queue position: <strong>#{member.claims[0].queuePosition}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatTile({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
