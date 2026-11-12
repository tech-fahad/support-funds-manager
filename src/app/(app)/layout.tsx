import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true },
  })

  if (!member) redirect("/onboarding")
  if (member.role === "suspended") redirect("/suspended")

  const isTrustee = member.role === "trustee"

  return (
    <div className="flex min-h-screen">
      <Sidebar isTrustee={isTrustee} />
      <main className="flex-1 p-6 overflow-auto bg-muted/20">{children}</main>
    </div>
  )
}
