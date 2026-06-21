"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpDown, Users, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Affiliate {
  id: string
  name: string
  email: string
  company: string | null
  trafficSource: string | null
  status: string
  subIdCode: string | null
  createdAt: string
  totalConversions: number
  totalEarnings: number
  clearedEarnings: number
}

type SortKey = "name" | "totalConversions" | "totalEarnings" | "createdAt"

const trafficLabels: Record<string, string> = {
  social_media: "Social",
  paid_ads: "Paid Ads",
  seo_content: "SEO",
  youtube: "YouTube",
  email: "Email",
  podcast: "Podcast",
  influencer: "Influencer",
  other: "Other",
}

export default function PartnersPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("totalEarnings")
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setAffiliates(data.filter((u: Affiliate) => u.status === "APPROVED"))
        setLoading(false)
      })
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...affiliates].sort((a, b) => {
    const av = sortKey === "name" ? a.name : sortKey === "createdAt" ? a.createdAt : (a[sortKey] as number)
    const bv = sortKey === "name" ? b.name : sortKey === "createdAt" ? b.createdAt : (b[sortKey] as number)
    if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  function SortButton({ col }: { col: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading…" : `${affiliates.length} active partners`}
          </p>
        </div>
        <Link
          href="/admin/approvals"
          className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline"
        >
          View approvals <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading partners…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No approved partners yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>
                  <span className="flex items-center gap-1">Partner <SortButton col="name" /></span>
                </TableHead>
                <TableHead>SubID Code</TableHead>
                <TableHead>Traffic</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">Conversions <SortButton col="totalConversions" /></span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">Earnings <SortButton col="totalEarnings" /></span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">Joined <SortButton col="createdAt" /></span>
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((u) => (
                <TableRow key={u.id} className="hover:bg-indigo-50/30">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.company && <p className="text-xs text-gray-400">{u.company}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {u.subIdCode ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.trafficSource ? (
                      <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded font-medium">
                        {trafficLabels[u.trafficSource] ?? u.trafficSource}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800">{u.totalConversions}</TableCell>
                  <TableCell className="font-semibold text-gray-800">{formatCurrency(u.totalEarnings)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/partners/${u.id}`}
                      className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                    >
                      Drilldown <ArrowRight className="w-3 h-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
