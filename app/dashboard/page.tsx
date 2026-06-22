import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Clock, Lock, TrendingUp, Activity, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EarningsChart } from "@/components/dashboard/earnings-chart"
import { formatCurrency, formatDate } from "@/lib/utils"

export const metadata = { title: "Overview — Partner Dashboard" }

const statusVariant: Record<string, "pending" | "locked" | "cleared" | "reversed"> = {
  PENDING: "pending", LOCKED: "locked", CLEARED: "cleared", REVERSED: "reversed",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [conversionGroups, recentConversions, monthlyConversions] = await Promise.all([
    prisma.conversion.groupBy({
      by: ["status"],
      where: { userId, removedByAdmin: false },
      _count: { _all: true },
      _sum: { affiliateEarning: true },
    }),
    prisma.conversion.findMany({
      where: { userId, removedByAdmin: false },
      orderBy: { actionDate: "desc" },
      take: 10,
      include: { offer: { select: { name: true, brand: true } } },
    }),
    prisma.conversion.findMany({
      where: { userId, status: "CLEARED", removedByAdmin: false, actionDate: { gte: sixMonthsAgo } },
      select: { actionDate: true, affiliateEarning: true },
    }),
  ])

  const statusMap: Record<string, { count: number; earnings: number }> = {}
  conversionGroups.forEach((g) => {
    statusMap[g.status] = { count: g._count._all, earnings: Number(g._sum.affiliateEarning ?? 0) }
  })

  const pending = statusMap.PENDING ?? { count: 0, earnings: 0 }
  const locked = statusMap.LOCKED ?? { count: 0, earnings: 0 }
  const cleared = statusMap.CLEARED ?? { count: 0, earnings: 0 }
  const totalConversions = conversionGroups.reduce((s, g) => s + g._count._all, 0)

  const monthlyMap: Record<string, number> = {}
  monthlyConversions.forEach((c) => {
    const key = c.actionDate.toISOString().slice(0, 7)
    monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(c.affiliateEarning)
  })

  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    chartData.push({
      month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      earnings: monthlyMap[d.toISOString().slice(0, 7)] ?? 0,
    })
  }

  const statCards = [
    {
      label: "Pending Earnings",
      value: pending.earnings,
      sub: `${pending.count} conversion${pending.count !== 1 ? "s" : ""}`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Locked Earnings",
      value: locked.earnings,
      sub: `${locked.count} conversion${locked.count !== 1 ? "s" : ""}`,
      icon: Lock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Cleared Earnings",
      value: cleared.earnings,
      sub: `${cleared.count} conversion${cleared.count !== 1 ? "s" : ""}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "All-Time Conversions",
      value: null,
      count: totalConversions,
      sub: "across all offers",
      icon: Activity,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session?.user.name}. Here&apos;s your performance at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, count, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-1.5">
                    {value !== null ? formatCurrency(value) : (count ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Cleared Earnings — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {monthlyConversions.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-gray-400">
                Chart will populate once your first conversions clear.
              </p>
            </div>
          ) : (
            <EarningsChart data={chartData} />
          )}
        </CardContent>
      </Card>

      {/* Recent conversions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Conversions</CardTitle>
            <Link
              href="/dashboard/links"
              className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
            >
              My tracking links <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentConversions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium mb-1">No conversions yet</p>
              <p className="text-xs text-gray-400">Share your tracking links to start driving conversions.</p>
              <Link
                href="/dashboard/links"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline"
              >
                Get my links <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Your Earning</TableHead>
                  <TableHead>Locks</TableHead>
                  <TableHead>Clears</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{formatDate(c.actionDate)}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{c.offer?.name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-400">{c.offer?.brand}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {c.status === "REVERSED" ? (
                        <span className="text-red-600">
                          -{formatCurrency(Number(c.affiliateEarning))}
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          {formatCurrency(Number(c.affiliateEarning))}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(c.lockingDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(c.clearingDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
