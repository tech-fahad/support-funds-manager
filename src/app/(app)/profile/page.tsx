import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatMonth, formatPKR } from "@/lib/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    include: {
      contributions: { orderBy: { month: "desc" } },
    },
  })

  if (!member) redirect("/onboarding")

  const roleLabel: Record<string, string> = {
    member: "Member",
    trustee: "Trustee",
    office_staff: "Office Staff",
    pending: "Pending Approval",
    suspended: "Suspended",
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Member Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Name" value={member.name} />
          <Row label="Email" value={member.email} />
          <Row label="Phone" value={member.phone ?? "—"} />
          <Row label="Role" value={
            <Badge variant={member.role === "suspended" ? "destructive" : "secondary"}>
              {roleLabel[member.role]}
            </Badge>
          } />
          <Row label="Joined" value={formatDate(member.joinedAt)} />
          {member.approvedAt && <Row label="Approved" value={formatDate(member.approvedAt)} />}
          <Row label="Pledge signed" value={member.pledgeSignedAt ? formatDate(member.pledgeSignedAt) : "Not yet signed"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contribution History</CardTitle></CardHeader>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatMonth(c.month)}</TableCell>
                    <TableCell>{formatPKR(c.amount)}</TableCell>
                    <TableCell>{c.paidAt ? formatDate(c.paidAt) : "—"}</TableCell>
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
