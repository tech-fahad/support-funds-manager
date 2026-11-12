import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const { actorId, month } = await req.json()

  const [totalIn, totalOut, activeMembers, suspendedMembers, arrearsGroups] = await Promise.all([
    prisma.contribution.aggregate({ _sum: { amount: true }, where: { status: { in: ["on_time", "late"] } } }),
    prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    prisma.member.count({ where: { role: { in: ["member", "trustee", "office_staff"] } } }),
    prisma.member.count({ where: { role: "suspended" } }),
    prisma.contribution.groupBy({
      by: ["memberId"],
      where: { status: "missed" },
    }),
  ])

  const totalInAmt = totalIn._sum.amount ?? 0
  const totalOutAmt = totalOut._sum.amount ?? 0
  const balance = totalInAmt - totalOutAmt

  const report = await prisma.monthlyReport.upsert({
    where: { month },
    update: {
      totalIn: totalInAmt,
      totalOut: totalOutAmt,
      balance,
      activeMembers,
      suspendedMembers,
      membersInArrears: arrearsGroups.length,
      publishedAt: new Date(),
      publishedById: actorId,
    },
    create: {
      month,
      totalIn: totalInAmt,
      totalOut: totalOutAmt,
      balance,
      activeMembers,
      suspendedMembers,
      membersInArrears: arrearsGroups.length,
      publishedAt: new Date(),
      publishedById: actorId,
    },
  })

  await logAction(actorId, "publish_report", "monthly_report", report.id, { month })

  return NextResponse.json(report)
}
