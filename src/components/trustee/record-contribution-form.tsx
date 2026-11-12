"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MONTHLY_CONTRIBUTION } from "@/lib/constants"

const selectClass = "w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

export function RecordContributionForm({
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
  const [form, setForm] = useState({
    memberId: "",
    month: "",
    paidAt: "",
    amount: String(MONTHLY_CONTRIBUTION),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const res = await fetch("/api/trustee/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), actorId }),
    })

    if (res.ok) {
      setSuccess("Contribution recorded.")
      setForm({ memberId: "", month: "", paidAt: "", amount: String(MONTHLY_CONTRIBUTION) })
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Record Contribution on Behalf of Member</CardTitle></CardHeader>
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
            <Label htmlFor="month">Month</Label>
            <Input id="month" type="month" value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paidAt">Date paid</Label>
            <Input id="paidAt" type="date" value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input id="amount" type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>

          <div className="col-span-2">
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            {success && <p className="text-sm text-green-700 mb-2">{success}</p>}
            <Button type="submit" disabled={loading || !form.memberId}>
              {loading ? "Saving..." : "Record payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
