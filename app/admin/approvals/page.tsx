"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, Users, Building2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

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
}

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

export default function ApprovalsPage() {
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchUsers() {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    setAffiliates(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function updateStatus(userId: string, status: "APPROVED" | "SUSPENDED" | "PENDING") {
    setActionLoading(userId + status)
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setActionLoading(null)

    if (res.ok) {
      const label = status === "APPROVED" ? "approved" : status === "SUSPENDED" ? "suspended" : "reset to pending"
      toast.success(`Partner ${label} successfully`)
      startTransition(() => { fetchUsers(); router.refresh() })
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Action failed")
    }
  }

  const pending = affiliates.filter((a) => a.status === "PENDING")
  const approved = affiliates.filter((a) => a.status === "APPROVED")
  const suspended = affiliates.filter((a) => a.status === "SUSPENDED")

  function AffiliateTable({ users, showActions }: { users: Affiliate[]; showActions: "approve" | "suspend" | "both" | "none" }) {
    if (loading) {
      return (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      )
    }
    if (users.length === 0) {
      return (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No users in this category</p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead>Traffic Source</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>SubID</TableHead>
            {showActions !== "none" && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div>
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {u.company && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {u.company}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {u.trafficSource ? (
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                    {trafficLabels[u.trafficSource] ?? u.trafficSource}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">{formatDate(u.createdAt)}</TableCell>
              <TableCell>
                {u.subIdCode ? (
                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {u.subIdCode}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">Not assigned</span>
                )}
              </TableCell>
              {showActions !== "none" && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(showActions === "approve" || showActions === "both") && u.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        disabled={actionLoading === u.id + "APPROVED"}
                        onClick={() => updateStatus(u.id, "APPROVED")}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {actionLoading === u.id + "APPROVED" ? "Approving…" : "Approve"}
                      </Button>
                    )}
                    {(showActions === "suspend" || showActions === "both") && u.status !== "SUSPENDED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                        disabled={actionLoading === u.id + "SUSPENDED"}
                        onClick={() => updateStatus(u.id, "SUSPENDED")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        {actionLoading === u.id + "SUSPENDED" ? "Suspending…" : "Suspend"}
                      </Button>
                    )}
                    {showActions === "both" && u.status === "SUSPENDED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => updateStatus(u.id, "PENDING")}
                      >
                        Reset to Pending
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and approve partner applications.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{pending.length} pending</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">{approved.length} approved</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-700">{suspended.length} suspended</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Tabs defaultValue="pending">
          <div className="px-6 pt-4 border-b border-gray-100">
            <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none">
              <TabsTrigger
                value="pending"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none pb-3 px-0 text-sm"
              >
                Pending
                {pending.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none pb-3 px-0 text-sm"
              >
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="suspended"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none pb-3 px-0 text-sm"
              >
                Suspended
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="mt-0">
            <AffiliateTable users={pending} showActions="approve" />
          </TabsContent>
          <TabsContent value="approved" className="mt-0">
            <AffiliateTable users={approved} showActions="suspend" />
          </TabsContent>
          <TabsContent value="suspended" className="mt-0">
            <AffiliateTable users={suspended} showActions="both" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
