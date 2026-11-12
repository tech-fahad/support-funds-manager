"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pledgeChecked, setPledgeChecked] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pledgeChecked) {
      setError("You must sign the member pledge to join.")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    })

    if (res.ok) {
      router.push("/dashboard")
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>Fill in your details and sign the member pledge to join the fund.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Member Pledge</p>
              <p>I join this fund in the spirit of charity (sadaqah), to give — not to receive for my own benefit.</p>
              <p>I commit to paying PKR 10,000 by the 5th of each month. I understand that missing 2 payments results in suspension.</p>
              <p>I accept that all contributions are non-refundable.</p>
              <p>I agree to abide by the fund rules and any changes voted on by members.</p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pledgeChecked}
                onChange={(e) => setPledgeChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm">I have read and agree to the member pledge above.</span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !pledgeChecked}>
              {loading ? "Saving..." : "Complete registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
