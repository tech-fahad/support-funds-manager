import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function PATCH(req: NextRequest) {
  const { payoutId, action, actorId } = await req.json()

  const payout = await prisma.payout.findUnique({ where: { id: payoutId } })
  if (!payout) return NextResponse.json({ error: "Payout not found" }, { status: 404 })

  if (action === "approve") {
    if (payout.approvedById1 === actorId || payout.approvedById2 === actorId) {
      return NextResponse.json({ error: "Already approved by this trustee" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (!payout.approvedById1) {
      updateData.approvedById1 = actorId
    } else if (!payout.approvedById2) {
      updateData.approvedById2 = actorId
      updateData.status = "approved"
      updateData.approvedAt = new Date()
    }

    await prisma.payout.update({ where: { id: payoutId }, data: updateData })
    await logAction(actorId, "approve_payout", "payout", payoutId)
  } else if (action === "confirm_paid") {
    if (payout.status !== "transfer_uploaded") {
      return NextResponse.json({ error: "Transfer document must be uploaded first" }, { status: 400 })
    }
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: "paid", paymentConfirmedById: actorId, paidAt: new Date() },
    })
    await logAction(actorId, "confirm_payout_paid", "payout", payoutId)
  }

  return NextResponse.json({ ok: true })
}
