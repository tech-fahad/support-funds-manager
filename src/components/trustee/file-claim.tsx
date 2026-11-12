"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const selectClass = "w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

export function FileClaim({
  members,
  actorId,
}: {
  members: { id: string; name: string }[]
  actorId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ memberId: "", type: "", noticeDate: "", noticePeriodEndDate: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, filedById: actorId }),
    })

    if (res.ok) {
      setSuccess("Claim filed.")
      setForm({ memberId: "", type: "", noticeDate: "", noticePeriodEndDate: "" })
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">File Claim on Behalf of Member</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Member</Label>
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className={selectClass} required>
              <option value="">Select member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Claim type</Label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectClass} required>
              <option value="">Select type</option>
              <option value="layoff">Layoff / downsizing</option>
              <option value="forced_resignation">Asked to resign</option>
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

          <div className="col-span-2">
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            {success && <p className="text-sm text-green-700 mb-2">{success}</p>}
            <Button type="submit" disabled={loading || !form.memberId || !form.type}>
              {loading ? "Filing..." : "File claim"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
