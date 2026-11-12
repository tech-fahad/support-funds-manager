import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function PATCH(req: NextRequest) {
  const { memberId, role, actorId } = await req.json()

  const validRoles = ["member", "suspended", "office_staff", "trustee"]
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const prev = await prisma.member.findUnique({ where: { id: memberId } })
  if (!prev) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: {
      role,
      approvedAt: role === "member" || role === "office_staff" ? new Date() : undefined,
      approvedById: role === "member" || role === "office_staff" ? actorId : undefined,
    },
  })

  await logAction(actorId, `set_role_${role}`, "member", memberId, { previousRole: prev.role })

  return NextResponse.json(updated)
}
