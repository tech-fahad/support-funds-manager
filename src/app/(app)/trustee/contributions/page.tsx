import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatMonth, formatPKR, currentMonth } from "@/lib/format"
import { RecordContributionForm } from "@/components/trustee/record-contribution-form"

export default async function TrusteeContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const thisMonth = currentMonth()

  const members = await prisma.member.findMany({
    where: { role: { in: ["member", "office_staff", "trustee"] } },
    orderBy: { name: "asc" },
    include: {
      contributions: {
        where: { month: thisMonth },
      },
    },
  })

  const allContribs = await prisma.contribution.findMany({
    orderBy: [{ month: "desc" }, { paidAt: "desc" }],
    include: { member: { select: { name: true } } },
    take: 100,
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Contributions Tracking</h1>

      <RecordContributionForm
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        actorId={me.id}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status for {formatMonth(thisMonth)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const contrib = member.contributions[0]
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{contrib ? formatPKR(contrib.amount) : "—"}</TableCell>
                    <TableCell>{contrib?.paidAt ? formatDate(contrib.paidAt) : "—"}</TableCell>
                    <TableCell>
                      {contrib ? (
                        <Badge variant={
                          contrib.status === "on_time" ? "default" :
                          contrib.status === "late" ? "secondary" : "destructive"
                        }>
                          {contrib.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Not paid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Contributions (All)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allContribs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{(c as { member: { name: string } }).member.name}</TableCell>
                  <TableCell>{formatMonth(c.month)}</TableCell>
                  <TableCell>{formatPKR(c.amount)}</TableCell>
                  <TableCell>{c.paidAt ? formatDate(c.paidAt) : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  )
}
