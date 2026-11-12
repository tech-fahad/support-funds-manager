import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { MEMBER_PAYOUT_AMOUNT, STAFF_PAYOUT_AMOUNT } from "@/lib/constants"

export async function POST(req: NextRequest) {
  const { actorId, month } = await req.json()

  const [totalIn, totalPaid] = await Promise.all([
    prisma.contribution.aggregate({ _sum: { amount: true }, where: { status: { in: ["on_time", "late"] } } }),
    prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
  ])
  let balance = (totalIn._sum.amount ?? 0) - (totalPaid._sum.amount ?? 0)

  const activeClaims = await prisma.claim.findMany({
    where: { status: "active" },
    include: { payouts: true, member: { select: { role: true } } },
    orderBy: { queuePosition: "asc" },
  })

  const payoutsToCreate: {
    claimId: string; memberId: string; monthNumber: number; amount: number
  }[] = []

  // 1. Second-month payouts for active month-1 recipients
  for (const claim of activeClaims) {
    const paidMonths = claim.payouts.filter((p: { status: string }) => p.status === "paid").length
    const pendingMonth2 = claim.payouts.find(
      (p: { monthNumber: number; status: string }) => p.monthNumber === 2 && p.status === "pending"
    )

    if (paidMonths === 1 && !pendingMonth2) {
      const amount = (claim.member as { role: string }).role === "office_staff"
        ? STAFF_PAYOUT_AMOUNT
        : MEMBER_PAYOUT_AMOUNT
      if (balance >= amount) {
        payoutsToCreate.push({ claimId: claim.id, memberId: claim.memberId, monthNumber: 2, amount })
        balance -= amount
      }
    }
  }

  // 2. Office staff from queue (max 1 per month)
  const staffQueue = await prisma.claim.findFirst({
    where: { status: "waiting" },
    include: { member: { select: { role: true } } },
    orderBy: { queuePosition: "asc" },
  })

  if (staffQueue && (staffQueue.member as { role: string }).role === "office_staff") {
    if (balance >= STAFF_PAYOUT_AMOUNT * 2) {
      payoutsToCreate.push({
        claimId: staffQueue.id,
        memberId: staffQueue.memberId,
        monthNumber: 1,
        amount: STAFF_PAYOUT_AMOUNT,
      })
      balance -= STAFF_PAYOUT_AMOUNT
      await prisma.claim.update({ where: { id: staffQueue.id }, data: { status: "active" } })
    }
  }

  // 3. Regular members from queue
  const memberQueue = await prisma.claim.findMany({
    where: { status: "waiting" },
    include: { member: { select: { role: true } } },
    orderBy: { queuePosition: "asc" },
    take: 10,
  })

  for (const claim of memberQueue) {
    if ((claim.member as { role: string }).role === "office_staff") continue
    if (balance < MEMBER_PAYOUT_AMOUNT) break
    payoutsToCreate.push({ claimId: claim.id, memberId: claim.memberId, monthNumber: 1, amount: MEMBER_PAYOUT_AMOUNT })
    balance -= MEMBER_PAYOUT_AMOUNT
    await prisma.claim.update({ where: { id: claim.id }, data: { status: "active" } })
  }

  // Create all payout records
  if (payoutsToCreate.length > 0) {
    await prisma.payout.createMany({ data: payoutsToCreate })
  }

  await logAction(actorId, "run_monthly_cycle", "cycle", month, {
    payoutsCreated: payoutsToCreate.length,
    remainingBalance: balance,
  })

  return NextResponse.json({
    message: `Cycle complete. ${payoutsToCreate.length} payout(s) created. Remaining balance: PKR ${balance.toLocaleString()}.`,
  })
}
