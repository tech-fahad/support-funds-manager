import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { ClaimReviewActions } from "@/components/trustee/claim-review-actions"
import { FileClaim } from "@/components/trustee/file-claim"

export default async function TrusteeClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const me = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!me || me.role !== "trustee") redirect("/dashboard")

  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { name: true, role: true } },
      filedBy: { select: { name: true } },
    },
  })

  const eligibleMembers = await prisma.member.findMany({
    where: { role: { in: ["member", "office_staff"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Claims Management</h1>

      <FileClaim members={eligibleMembers} actorId={me.id} />

      <Card>
        <CardHeader><CardTitle className="text-base">All Claims</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Notice Date</TableHead>
                <TableHead>Filed By</TableHead>
                <TableHead>Queue #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">
                    {(claim as { member: { name: string } }).member.name}
                    {(claim as { member: { role: string } }).member.role === "office_staff" && (
                      <span className="ml-1 text-xs text-muted-foreground">(staff)</span>
                    )}
                  </TableCell>
                  <TableCell>{claim.type.replace("_", " ")}</TableCell>
                  <TableCell>{formatDate(claim.noticeDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(claim as { filedBy: { name: string } | null }).filedBy?.name ?? "Self"}
                  </TableCell>
                  <TableCell>{claim.queuePosition ? `#${claim.queuePosition}` : "—"}</TableCell>
                  <TableCell><Badge>{claim.status}</Badge></TableCell>
                  <TableCell>
                    {claim.status === "pending" && (
                      <ClaimReviewActions claimId={claim.id} actorId={me.id} />
                    )}
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
