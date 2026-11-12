"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RunCycleButton({ actorId, month }: { actorId: string; month: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  async function run() {
    if (!confirm("Run the monthly cycle? This will create payout records.")) return
    setLoading(true)
    const res = await fetch("/api/trustee/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, month }),
    })
    const data = await res.json()
    setResult(data.message ?? (res.ok ? "Cycle complete." : "Error running cycle."))
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-1">
      <Button onClick={run} disabled={loading}>
        {loading ? "Running..." : "Run monthly cycle"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  )
}
