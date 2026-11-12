"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ClaimReviewActions({ claimId, actorId }: { claimId: string; actorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function action(decision: "approve" | "reject") {
    setLoading(true)
    await fetch("/api/trustee/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, decision, actorId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => action("approve")} disabled={loading}>Approve</Button>
      <Button size="sm" variant="destructive" onClick={() => action("reject")} disabled={loading}>Reject</Button>
    </div>
  )
}
