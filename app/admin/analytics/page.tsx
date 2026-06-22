"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart3, TrendingUp, DollarSign, Activity, Users, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

interface Offer { id: string; name: string; brand: string }

interface OfferRow {
  offerId: string | null; brand: string; name: string
  pending: number; locked: number; cleared: number; reversed: number
  grossCommission: number; affiliateEarning: number; count: number
}

interface AffiliateRow {
  userId: string
  user: { id: string; name: string; email: string; subIdCode: string | null } | null
  count: number; grossCommission: number; affiliateEarning: number
}

interface DayRow { date: string; count: number; grossCommission: number }

interface Totals {
  conversions: number; grossCommission: number; affiliateEarning: number
  saleAmount: number; pending: number; locked: number; cleared: number; reversed: number
}

interface AnalyticsData {
  totals: Totals
  offerBreakdown: OfferRow[]
  topAffiliates: AffiliateRow[]
  daily: DayRow[]
  offers: Offer[]
}

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 180 days", days: 180 },
  { label: "All time", days: 0 },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rangeDays, setRangeDays] = useState(30)
  const [offerId, setOfferId] = useState<string>("__all__")

  const fetchData = useCallback(async (days: number, offerFilter: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (days > 0) params.set("dateFrom", daysAgo(days))
    if (offerFilter !== "__all__") params.set("offerId", offerFilter)
    const res = await fetch(`/api/admin/analytics?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData(rangeDays, offerId) }, [rangeDays, offerId, fetchData])

  const statCards = data
    ? [
        {
          label: "Total Conversions",
          value: data.totals.conversions.toLocaleString(),
          icon: Activity,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Gross Revenue",
          value: formatCurrency(data.totals.grossCommission),
          icon: TrendingUp,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "Paid to Affiliates",
          value: formatCurrency(data.totals.affiliateEarning),
          icon: DollarSign,
          color: "text-violet-600",
          bg: "bg-violet-50",
        },
        {
          label: "My Margin",
          value: formatCurrency(data.totals.grossCommission - data.totals.affiliateEarning),
          icon: BarChart3,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
      ]
    : []

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header + filters */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Filter conversions and earnings by date range and brand.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v))}>
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.days} value={String(r.days)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={offerId} onValueChange={setOfferId}>
            <SelectTrigger className="h-9 w-52 text-sm">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All brands</SelectItem>
              {data?.offers.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pending", count: data!.totals.pending, variant: "pending" as const },
              { label: "Locked", count: data!.totals.locked, variant: "locked" as const },
              { label: "Cleared", count: data!.totals.cleared, variant: "cleared" as const },
              { label: "Reversed", count: data!.totals.reversed, variant: "reversed" as const },
            ].map(({ label, count, variant }) => (
              <div key={label} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <Badge variant={variant}>{count}</Badge>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-2">{count.toLocaleString()}</p>
                <p className="text-xs text-gray-400">conversions</p>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          {data!.daily.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Conversions Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data!.daily} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "grossCommission" ? [formatCurrency(value), "Gross Revenue"] : [value, "Conversions"]
                      }
                      labelFormatter={(label: string) => `Date: ${label}`}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === "count" ? "Conversions" : "Gross Revenue ($)"
                      }
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="grossCommission" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Brand breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Performance by Brand</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data!.offerBreakdown.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No data for this period</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">
                        <Badge variant="pending" className="font-semibold">Pending</Badge>
                      </TableHead>
                      <TableHead className="text-center">
                        <Badge variant="locked" className="font-semibold">Locked</Badge>
                      </TableHead>
                      <TableHead className="text-center">
                        <Badge variant="cleared" className="font-semibold">Cleared</Badge>
                      </TableHead>
                      <TableHead className="text-center">
                        <Badge variant="reversed" className="font-semibold">Reversed</Badge>
                      </TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-right">Affiliate Payout</TableHead>
                      <TableHead className="text-right">My Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.offerBreakdown.map((row) => (
                      <TableRow key={row.offerId ?? "__unknown__"}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">{row.brand}</p>
                          <p className="text-xs text-gray-400">{row.name}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium">{row.count}</TableCell>
                        <TableCell className="text-center text-amber-600">{row.pending}</TableCell>
                        <TableCell className="text-center text-blue-600">{row.locked}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.cleared}</TableCell>
                        <TableCell className="text-center text-red-500">{row.reversed}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.grossCommission)}</TableCell>
                        <TableCell className="text-right text-indigo-700">{formatCurrency(row.affiliateEarning)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {formatCurrency(row.grossCommission - row.affiliateEarning)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Top affiliates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Top Affiliates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data!.topAffiliates.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No data for this period</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Affiliate</TableHead>
                      <TableHead>SubID</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-right">Affiliate Payout</TableHead>
                      <TableHead className="text-right">My Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.topAffiliates.map((a) => (
                      <TableRow key={a.userId}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">{a.user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-400">{a.user?.email}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {a.user?.subIdCode ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{a.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.grossCommission)}</TableCell>
                        <TableCell className="text-right text-indigo-700">{formatCurrency(a.affiliateEarning)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {formatCurrency(a.grossCommission - a.affiliateEarning)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
