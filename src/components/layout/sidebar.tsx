"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  CreditCard,
  ListOrdered,
  FileText,
  BarChart3,
  Vote,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const memberNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/contributions", label: "Contributions", icon: CreditCard },
  { href: "/claim", label: "My Claim", icon: FileText },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/votes", label: "Governance", icon: Vote },
  { href: "/reports", label: "Reports", icon: FileText },
]

const trusteeNav = [
  { href: "/trustee", label: "Trustee Overview", icon: ShieldCheck },
  { href: "/trustee/members", label: "Members", icon: User },
  { href: "/trustee/contributions", label: "Contributions", icon: CreditCard },
  { href: "/trustee/claims", label: "Claims", icon: FileText },
  { href: "/trustee/payouts", label: "Payouts", icon: CreditCard },
  { href: "/trustee/cycle", label: "Monthly Cycle", icon: Settings },
]

interface SidebarProps {
  isTrustee?: boolean
}

export function Sidebar({ isTrustee }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r bg-background px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-sm font-semibold leading-tight text-foreground">
          Mutual Layoff<br />Support Fund
        </h1>
      </div>

      <nav className="flex-1 space-y-0.5">
        {memberNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isTrustee && (
          <>
            <div className="my-2 px-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trustee
              </p>
            </div>
            {trusteeNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  )
}
