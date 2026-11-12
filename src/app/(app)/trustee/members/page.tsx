import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { MemberActions } from "@/components/trustee/member-actions"

export default async function TrusteeMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const members = await prisma.member.findMany({
    orderBy: { joinedAt: "desc" },
    include: {
      contributions: { orderBy: { month: "desc" }, take: 2 },
    },
  })

  const roleColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    member: "default",
    trustee: "default",
    office_staff: "secondary",
    pending: "outline",
    suspended: "destructive",
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Member Management</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last 2 Months</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleColor[member.role]}>
                      {member.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(member.joinedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {member.contributions.map((c: { id: string; status: string; month: string }) => (
                        <Badge
                          key={c.id}
                          variant={c.status === "on_time" ? "default" : c.status === "late" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {c.month.slice(5)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <MemberActions
                      memberId={member.id}
                      currentRole={member.role}
                      actorId={me.id}
                    />
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
