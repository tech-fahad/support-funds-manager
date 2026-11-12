"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ClaimForm({ memberId }: { memberId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ type: "", noticeDate: "", noticePeriodEndDate: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...form }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit a Claim</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Claim type</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select type</option>
              <option value="layoff">Layoff / downsizing / restructuring</option>
              <option value="forced_resignation">Asked to resign by company</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="noticeDate">Notice date</Label>
            <Input id="noticeDate" type="date" value={form.noticeDate}
              onChange={(e) => setForm({ ...form, noticeDate: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="noticePeriodEndDate">Notice period end date</Label>
            <Input id="noticePeriodEndDate" type="date" value={form.noticePeriodEndDate}
              onChange={(e) => setForm({ ...form, noticePeriodEndDate: e.target.value })} required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !form.type}>
            {loading ? "Submitting..." : "Submit claim"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
