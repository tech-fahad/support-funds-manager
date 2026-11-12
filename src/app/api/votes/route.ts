import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const { proposalId, memberId, vote } = await req.json()

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } })
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
  if (proposal.status !== "open") return NextResponse.json({ error: "Voting is closed" }, { status: 400 })
  if (new Date(proposal.votingDeadline) < new Date()) {
    return NextResponse.json({ error: "Voting deadline has passed" }, { status: 400 })
  }

  await prisma.vote.upsert({
    where: { proposalId_memberId: { proposalId, memberId } },
    update: { vote, votedAt: new Date() },
    create: { proposalId, memberId, vote },
  })

  await logAction(memberId, "vote", "proposal", proposalId, { vote })

  return NextResponse.json({ ok: true })
}
