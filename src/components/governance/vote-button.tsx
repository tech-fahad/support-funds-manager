"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function VoteButton({
  proposalId,
  memberId,
  currentVote,
}: {
  proposalId: string
  memberId: string
  currentVote: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function vote(choice: "yes" | "no") {
    setLoading(true)
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId, memberId, vote: choice }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={currentVote === "yes" ? "default" : "outline"}
        disabled={loading}
        onClick={() => vote("yes")}
      >
        Yes
      </Button>
      <Button
        size="sm"
        variant={currentVote === "no" ? "destructive" : "outline"}
        disabled={loading}
        onClick={() => vote("no")}
      >
        No
      </Button>
    </div>
  )
}
