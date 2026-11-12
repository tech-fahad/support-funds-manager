import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const payoutId = formData.get("payoutId") as string
  const actorId = formData.get("actorId") as string

  if (!file || !payoutId) {
    return NextResponse.json({ error: "Missing file or payoutId" }, { status: 400 })
  }

  const supabase = await createClient()
  const ext = file.name.split(".").pop()
  const path = `transfer-docs/${payoutId}.${ext}`

  const { error } = await supabase.storage
    .from("fund-documents")
    .upload(path, file, { upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("fund-documents").getPublicUrl(path)

  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "transfer_uploaded",
      transferDocumentUrl: publicUrl,
      transferUploadedById: actorId,
      transferUploadedAt: new Date(),
    },
  })

  await logAction(actorId, "upload_transfer_doc", "payout", payoutId, { path })

  return NextResponse.json({ ok: true, url: publicUrl })
}
