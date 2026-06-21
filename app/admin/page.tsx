import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Users,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

export const metadata = { title: "Overview" }

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)

  const [activePartners, pendingApprovals, conversionStats, clearedAgg, lastSync, recentPending] =
    await Promise.all([
      prisma.user.count({ where: { role: "AFFILIATE", status: "APPROVED" } }),
      prisma.user.count({ where: { role: "AFFILIATE", status: "PENDING" } }),
      prisma.conversion.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { grossCommission: true, affiliateEarning: true },
      }),
      prisma.conversion.aggregate({
        where: { status: "CLEARED" },
        _sum: { grossCommission: true, affiliateEarning: true },
      }),
      prisma.syncLog.findFirst({ orderBy: { runAt: "desc" } }),
      prisma.user.findMany({
        where: { role: "AFFILIATE", status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, company: true, trafficSource: true, createdAt: true },
      }),
    ])

  const totalConversions = conversionStats.reduce((s, g) => s + g._count._all, 0)
  const grossRevenue = Number(clearedAgg._sum.grossCommission ?? 0)
  const paidOut = Number(clearedAgg._sum.affiliateEarning ?? 0)
  const myMargin = grossRevenue - paidOut

  const trafficLabels: Record<string, string> = {
    social_media: "Social Media",
    paid_ads: "Paid Ads",
    seo_content: "SEO / Content",
    youtube: "YouTube",
    email: "Email",
    podcast: "Podcast",
    influencer: "Influencer",
    other: "Other",
  }

  const stats = [
    {
      label: "Active Partners",
      value: activePartners.toLocaleString(),
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/partners",
    },
    {
      label: "Total Conversions",
      value: totalConversions.toLocaleString(),
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: null,
    },
    {
      label: "Cleared Revenue",
      value: formatCurrency(grossRevenue),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: null,
    },
    {
      label: "My Margin",
      value: formatCurrency(myMargin),
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: null,
    },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session?.user.name}. Here&apos;s your platform at a glance.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              {href && (
                <Link href={href} className={`text-xs ${color} font-medium flex items-center gap-1 mt-3 hover:underline`}>
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending approvals */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  Pending Approvals
                  {pendingApprovals > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {pendingApprovals}
                    </span>
                  )}
                </CardTitle>
                <Link
                  href="/admin/approvals"
                  className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentPending.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All caught up — no pending applications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPending.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {u.company && (
                            <span className="text-xs text-gray-400">{u.company}</span>
                          )}
                          {u.trafficSource && (
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {trafficLabels[u.trafficSource] ?? u.trafficSource}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                        <Link
                          href="/admin/approvals"
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sync status */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Last Sync</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {lastSync ? (
                <>
                  <div className="flex items-center gap-2">
                    {lastSync.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : lastSync.status === "PARTIAL" ? (
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        lastSync.status === "SUCCESS"
                          ? "text-emerald-700"
                          : lastSync.status === "PARTIAL"
                            ? "text-amber-700"
                            : "text-red-700"
                      }`}
                    >
                      {lastSync.status === "SUCCESS"
                        ? "Successful"
                        : lastSync.status === "PARTIAL"
                          ? "Partial"
                          : "Failed"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Run at</span>
                      <span className="font-medium text-gray-700">{formatDate(lastSync.runAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Records pulled</span>
                      <span className="font-medium text-gray-700">{lastSync.recordsPulled}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">New records</span>
                      <span className="font-medium text-emerald-700">+{lastSync.recordsNew}</span>
                    </div>
                    {lastSync.errorMessage && (
                      <p className="text-xs text-red-600 bg-red-50 rounded p-2">{lastSync.errorMessage}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No syncs yet</p>
                </div>
              )}
              <Link
                href="/admin/sync"
                className="block w-full text-center text-xs bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 font-medium transition-colors"
              >
                Go to Sync Panel
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
