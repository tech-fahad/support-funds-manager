import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { CONTRIBUTION_GRACE_DAY } from "@/lib/constants"

export async function POST(req: NextRequest) {
  const { memberId, month, paidAt, amount, actorId } = await req.json()

  if (!memberId || !month || !paidAt || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const paidDate = new Date(paidAt)
  const [year, m] = month.split("-").map(Number)
  const graceDeadline = new Date(year, m - 1, CONTRIBUTION_GRACE_DAY)
  const status = paidDate <= graceDeadline ? "on_time" : "late"

  const contribution = await prisma.contribution.upsert({
    where: { memberId_month: { memberId, month } },
    update: { amount, paidAt: paidDate, status, recordedById: actorId },
    create: { memberId, month, amount, paidAt: paidDate, status, recordedById: actorId },
  })

  await logAction(actorId, "record_contribution", "contribution", contribution.id, { memberId, month, amount })

  return NextResponse.json(contribution)
}
