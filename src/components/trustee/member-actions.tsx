"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export function MemberActions({
  memberId,
  currentRole,
  actorId,
}: {
  memberId: string
  currentRole: string
  actorId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateRole(role: string) {
    setLoading(true)
    await fetch("/api/trustee/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role, actorId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole === "pending" && (
          <DropdownMenuItem onClick={() => updateRole("member")}>
            Approve as member
          </DropdownMenuItem>
        )}
        {currentRole === "pending" && (
          <DropdownMenuItem onClick={() => updateRole("office_staff")}>
            Approve as office staff
          </DropdownMenuItem>
        )}
        {currentRole === "member" && (
          <DropdownMenuItem onClick={() => updateRole("suspended")} className="text-destructive">
            Suspend
          </DropdownMenuItem>
        )}
        {currentRole === "suspended" && (
          <DropdownMenuItem onClick={() => updateRole("member")}>
            Reinstate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
