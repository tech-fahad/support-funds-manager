import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const { memberId, type, noticeDate, noticePeriodEndDate, filedById } = await req.json()

  if (!memberId || !type || !noticeDate || !noticePeriodEndDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  if (member.role === "suspended") {
    return NextResponse.json({ error: "Suspended members cannot file claims" }, { status: 403 })
  }

  // Check no unpaid contributions
  const missedContribs = await prisma.contribution.count({
    where: { memberId, status: "missed" },
  })
  if (missedContribs > 0 && member.role !== "office_staff") {
    return NextResponse.json({ error: "Member has unpaid contributions" }, { status: 400 })
  }

  // Check no existing active claim
  const existing = await prisma.claim.findFirst({
    where: { memberId, status: { notIn: ["rejected", "closed", "completed"] } },
  })
  if (existing) {
    return NextResponse.json({ error: "Member already has an active claim" }, { status: 400 })
  }

  const claim = await prisma.claim.create({
    data: {
      memberId,
      type,
      noticeDate: new Date(noticeDate),
      noticePeriodEndDate: new Date(noticePeriodEndDate),
      filedById: filedById ?? null,
    },
  })

  await logAction(filedById ?? memberId, "file_claim", "claim", claim.id, { type, noticeDate })

  return NextResponse.json(claim)
}
