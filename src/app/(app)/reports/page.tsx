import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMonth, formatPKR, formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

export default async function ReportsPage() {
  const reports = await prisma.monthlyReport.findMany({
    orderBy: { month: "desc" },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Monthly Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Published by the 10th of each month.</p>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports published yet.</p>
      ) : (
        reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{formatMonth(report.month)}</CardTitle>
                <Badge variant={report.publishedAt ? "default" : "secondary"}>
                  {report.publishedAt ? `Published ${formatDate(report.publishedAt)}` : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Total contributions received</TableCell>
                    <TableCell className="font-medium text-right">{formatPKR(report.totalIn)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Total paid out</TableCell>
                    <TableCell className="font-medium text-right">{formatPKR(report.totalOut)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium">Balance</TableCell>
                    <TableCell className="font-semibold text-right">{formatPKR(report.balance)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Active members</TableCell>
                    <TableCell className="text-right">{report.activeMembers}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Suspended members</TableCell>
                    <TableCell className="text-right">{report.suspendedMembers}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Members in arrears</TableCell>
                    <TableCell className="text-right">{report.membersInArrears}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
