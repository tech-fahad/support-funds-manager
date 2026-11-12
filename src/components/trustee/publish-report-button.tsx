"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function PublishReportButton({
  actorId,
  month,
  alreadyPublished,
}: {
  actorId: string
  month: string
  alreadyPublished: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function publish() {
    if (!confirm("Publish the monthly report? This cannot be undone.")) return
    setLoading(true)
    await fetch("/api/trustee/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, month }),
    })
    router.refresh()
    setLoading(false)
  }

  if (alreadyPublished) {
    return <p className="text-sm text-green-700">Report already published for this month.</p>
  }

  return (
    <Button variant="outline" onClick={publish} disabled={loading}>
      {loading ? "Publishing..." : "Publish report"}
    </Button>
  )
}
