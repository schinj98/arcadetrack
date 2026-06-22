"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Tag,
  DollarSign,
  RefreshCw,
  TrendingUp,
  LogOut,
  ExternalLink,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/approvals", label: "Approvals", icon: UserCheck, badgeKey: "pending" },
  { href: "/admin/partners", label: "Partners", icon: Users },
  { href: "/admin/offers", label: "Offers", icon: Tag },
  { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
  { href: "/admin/sync", label: "Sync", icon: RefreshCw },
] as const

interface AdminSidebarProps {
  pendingCount: number
  userName: string
  userEmail: string
}

export function AdminSidebar({ pendingCount, userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none">ArcadeTrack</p>
            <p className="text-xs text-indigo-400 mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const isActive = "exact" in item && item.exact ? pathname === href : pathname.startsWith(href)
          const showBadge = "badgeKey" in item && item.badgeKey === "pending" && pendingCount > 0

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-4 space-y-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View affiliate dashboard
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
