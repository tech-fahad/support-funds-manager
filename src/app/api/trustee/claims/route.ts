import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function PATCH(req: NextRequest) {
  const { claimId, decision, actorId } = await req.json()

  const claim = await prisma.claim.findUnique({ where: { id: claimId } })
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 })
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Claim is not in pending state" }, { status: 400 })
  }

  if (decision === "approve") {
    // Find next queue position
    const lastInQueue = await prisma.claim.findFirst({
      where: { status: { in: ["waiting", "active"] } },
      orderBy: { queuePosition: "desc" },
    })
    const nextPosition = (lastInQueue?.queuePosition ?? 0) + 1

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: "waiting",
        queuePosition: nextPosition,
        queueEnteredAt: new Date(),
        approvedById: actorId,
        approvedAt: new Date(),
      },
    })
    await logAction(actorId, "approve_claim", "claim", claimId, { queuePosition: nextPosition })
  } else {
    await prisma.claim.update({
      where: { id: claimId },
      data: { status: "rejected", approvedById: actorId, approvedAt: new Date() },
    })
    await logAction(actorId, "reject_claim", "claim", claimId)
  }

  return NextResponse.json({ ok: true })
}
