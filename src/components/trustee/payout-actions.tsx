"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface PayoutActionProps {
  payout: {
    id: string
    status: string
    approvedById1: string | null
    approvedById2: string | null
    transferDocumentUrl: string | null
  }
  actorId: string
}

export function PayoutActions({ payout, actorId }: PayoutActionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const alreadyApproved = payout.approvedById1 === actorId || payout.approvedById2 === actorId

  async function approvePayout() {
    setLoading(true)
    await fetch("/api/trustee/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: payout.id, action: "approve", actorId }),
    })
    router.refresh()
    setLoading(false)
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("payoutId", payout.id)
    formData.append("actorId", actorId)

    await fetch("/api/trustee/payouts/upload", { method: "POST", body: formData })
    router.refresh()
    setLoading(false)
  }

  async function confirmPaid() {
    setLoading(true)
    await fetch("/api/trustee/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: payout.id, action: "confirm_paid", actorId }),
    })
    router.refresh()
    setLoading(false)
  }

  if (payout.status === "paid") return null

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {payout.status === "pending" && !alreadyApproved && (
        <Button size="sm" onClick={approvePayout} disabled={loading}>Approve</Button>
      )}

      {payout.status === "approved" && (
        <>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={loading}>
            Upload transfer doc
          </Button>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={uploadDocument} />
        </>
      )}

      {payout.status === "transfer_uploaded" && (
        <Button size="sm" onClick={confirmPaid} disabled={loading}>Confirm paid</Button>
      )}
    </div>
  )
}
