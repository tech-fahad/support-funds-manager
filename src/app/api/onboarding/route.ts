import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { name, phone } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const existing = await prisma.member.findUnique({ where: { userId: user.id } })
  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 400 })

  await prisma.member.create({
    data: {
      userId: user.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: user.email!,
      role: "pending",
      pledgeSignedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
