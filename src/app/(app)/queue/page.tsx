import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"

export default async function QueuePage() {
  const queue = await prisma.claim.findMany({
    where: { status: { in: ["waiting", "active"] } },
    orderBy: [{ queuePosition: "asc" }, { queueEnteredAt: "asc" }],
    include: { member: { select: { id: true, role: true } } },
  })

  const receiving = await prisma.claim.findMany({
    where: { status: "active" },
    include: {
      payouts: { orderBy: { monthNumber: "asc" } },
      member: { select: { id: true } },
    },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Waiting List</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Updated by the 10th of each month. Names are not shown.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Currently Receiving Help</CardTitle></CardHeader>
        <CardContent className="p-0">
          {receiving.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No one is currently receiving help.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member #</TableHead>
                  <TableHead>Queue Since</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiving.map((claim: {
                  id: string;
                  queueEnteredAt: Date | null;
                  member: { id: string };
                  payouts: { monthNumber: number; status: string }[];
                }) => {
                  const currentPayout = claim.payouts.find(
                    (p: { status: string }) => p.status !== "paid"
                  ) ?? claim.payouts[claim.payouts.length - 1]
                  return (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono text-xs">{claim.member.id.slice(-6).toUpperCase()}</TableCell>
                      <TableCell>{claim.queueEnteredAt ? formatDate(claim.queueEnteredAt) : "—"}</TableCell>
                      <TableCell>{currentPayout ? `Month ${currentPayout.monthNumber} of 2` : "—"}</TableCell>
                      <TableCell><Badge>active</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Waiting Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {queue.filter((c: { status: string }) => c.status === "waiting").length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">No one is currently waiting.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Member #</TableHead>
                  <TableHead>Queue Since</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue
                  .filter((c: { status: string }) => c.status === "waiting")
                  .map((claim: {
                    id: string;
                    queuePosition: number | null;
                    queueEnteredAt: Date | null;
                    type: string;
                    member: { id: string; role: string };
                  }, i: number) => (
                    <TableRow key={claim.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{claim.member.id.slice(-6).toUpperCase()}</TableCell>
                      <TableCell>{claim.queueEnteredAt ? formatDate(claim.queueEnteredAt) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {claim.member.role === "office_staff" ? "Staff" : "Member"}
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
