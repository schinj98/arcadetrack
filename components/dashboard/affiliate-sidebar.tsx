"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Link2, DollarSign, TrendingUp, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/links", label: "My Links", icon: Link2 },
  { href: "/dashboard/payouts", label: "Payouts", icon: DollarSign },
] as const

interface AffiliateSidebarProps {
  userName: string
  userEmail: string
  subIdCode: string
}

export function AffiliateSidebar({ userName, userEmail, subIdCode }: AffiliateSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none">ArcadeTrack</p>
            <p className="text-xs text-indigo-400 mt-0.5">Partner Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const isActive = "exact" in item && item.exact ? pathname === href : pathname.startsWith(href)
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
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* SubID badge */}
      {subIdCode && (
        <div className="px-4 py-3 mx-3 mb-1 bg-slate-800 rounded-lg">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Your SubID</p>
          <p className="font-mono text-xs text-indigo-400 font-bold">{subIdCode}</p>
        </div>
      )}

      {/* User info + sign out */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </aside>
  )
}
