"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle, XCircle, Clock, Users, Building2, Loader2,
  ExternalLink, AlertCircle, UserPlus, Eye, EyeOff,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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

interface ImpactCampaign {
  campaignId: string
  campaignName: string
  advertiserName: string
  advertiserUrl: string
  description: string
  trackingLink: string
  logoPath: string
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

  // Approval dialog state
  const [approveTarget, setApproveTarget] = useState<Affiliate | null>(null)
  const [subIdInput, setSubIdInput] = useState("")
  const [campaigns, setCampaigns] = useState<ImpactCampaign[]>([])
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set())
  const [campaignCommissions, setCampaignCommissions] = useState<Record<string, string>>({})
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  // Suspend loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create partner manually
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "", email: "", password: "", subIdCode: "", company: "", trafficSource: "", mediaProperties: "",
  })
  const [showCreatePw, setShowCreatePw] = useState(false)
  const [creating, setCreating] = useState(false)

  function setCreateField(key: keyof typeof createForm, value: string) {
    setCreateForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitCreate() {
    const { name, email, password, subIdCode } = createForm
    if (!name.trim() || !email.trim() || !password.trim() || !subIdCode.trim()) {
      toast.error("Name, email, password, and SubID are required")
      return
    }
    if (!/^[A-Z0-9]+$/.test(subIdCode)) {
      toast.error("SubID must be uppercase letters and numbers only")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setCreating(true)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        subIdCode,
        company: createForm.company.trim() || undefined,
        trafficSource: createForm.trafficSource.trim() || undefined,
        mediaProperties: createForm.mediaProperties.trim() || undefined,
      }),
    })
    setCreating(false)
    if (res.ok) {
      toast.success(`Partner ${name} created and approved`)
      setCreateOpen(false)
      setCreateForm({ name: "", email: "", password: "", subIdCode: "", company: "", trafficSource: "", mediaProperties: "" })
      startTransition(() => { fetchUsers(); router.refresh() })
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Failed to create partner")
    }
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    setAffiliates(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function openApproveDialog(affiliate: Affiliate) {
    setApproveTarget(affiliate)
    setSubIdInput(affiliate.subIdCode ?? "")
    setSelectedCampaignIds(new Set())
    setCampaignCommissions({})
    setCampaignsError(null)

    if (campaigns.length === 0) {
      setCampaignsLoading(true)
      try {
        const res = await fetch("/api/admin/impact-campaigns")
        if (!res.ok) throw new Error("Failed to fetch campaigns")
        const data: ImpactCampaign[] = await res.json()
        setCampaigns(data)
      } catch (err) {
        setCampaignsError(err instanceof Error ? err.message : "Could not load Impact campaigns")
      } finally {
        setCampaignsLoading(false)
      }
    }
  }

  function toggleCampaign(id: string) {
    setSelectedCampaignIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // Default commission to empty string when first selected
    setCampaignCommissions((prev) => ({
      ...prev,
      [id]: prev[id] ?? "",
    }))
  }

  function setCommission(campaignId: string, value: string) {
    const num = value.replace(/[^0-9.]/g, "")
    setCampaignCommissions((prev) => ({ ...prev, [campaignId]: num }))
  }

  async function submitApproval() {
    if (!approveTarget) return
    const trimmedId = subIdInput.trim().toUpperCase()

    if (!trimmedId) {
      toast.error("SubID is required")
      return
    }
    if (!/^[A-Z0-9]+$/.test(trimmedId)) {
      toast.error("SubID must be uppercase letters and numbers only")
      return
    }
    if (selectedCampaignIds.size === 0) {
      toast.error("Select at least one brand to grant access")
      return
    }

    // Validate all selected campaigns have a commission
    const missingCommission = campaigns
      .filter((c) => selectedCampaignIds.has(c.campaignId) && c.trackingLink)
      .filter((c) => {
        const val = parseFloat(campaignCommissions[c.campaignId] ?? "")
        return isNaN(val) || val < 0 || val > 100
      })
    if (missingCommission.length > 0) {
      toast.error(`Enter a commission % (0–100) for: ${missingCommission.map((c) => c.advertiserName).join(", ")}`)
      return
    }

    const selectedCampaigns = campaigns
      .filter((c) => selectedCampaignIds.has(c.campaignId))
      .map((c) => ({
        campaignId: c.campaignId,
        campaignName: c.campaignName,
        advertiserName: c.advertiserName,
        trackingLink: c.trackingLink,
        commissionSplitPercent: parseFloat(campaignCommissions[c.campaignId] ?? "0"),
      }))

    const campaignsWithoutLinks = selectedCampaigns.filter((c) => !c.trackingLink)
    if (campaignsWithoutLinks.length === selectedCampaigns.length) {
      toast.error("None of the selected brands have a tracking link available")
      return
    }
    if (campaignsWithoutLinks.length > 0) {
      toast.warning(
        `${campaignsWithoutLinks.map((c) => c.advertiserName).join(", ")} ${campaignsWithoutLinks.length === 1 ? "has" : "have"} no tracking link and will be skipped`
      )
    }

    setApproving(true)
    const res = await fetch(`/api/admin/users/${approveTarget.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", subIdCode: trimmedId, campaigns: selectedCampaigns }),
    })
    setApproving(false)

    if (res.ok) {
      toast.success(`${approveTarget.name} approved with SubID ${trimmedId}`)
      setApproveTarget(null)
      startTransition(() => { fetchUsers(); router.refresh() })
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Approval failed")
    }
  }

  async function updateStatus(userId: string, status: "SUSPENDED" | "PENDING") {
    setActionLoading(userId + status)
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setActionLoading(null)

    if (res.ok) {
      const label = status === "SUSPENDED" ? "suspended" : "reset to pending"
      toast.success(`Partner ${label}`)
      startTransition(() => { fetchUsers(); router.refresh() })
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Action failed")
    }
  }

  const pending = affiliates.filter((a) => a.status === "PENDING")
  const approved = affiliates.filter((a) => a.status === "APPROVED")
  const suspended = affiliates.filter((a) => a.status === "SUSPENDED")

  function AffiliateTable({
    users,
    showApprove,
    showSuspend,
  }: {
    users: Affiliate[]
    showApprove?: boolean
    showSuspend?: boolean
  }) {
    if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
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
            <TableHead className="text-right">Actions</TableHead>
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
                      <Building2 className="w-3 h-3" /> {u.company}
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
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {showApprove && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                      onClick={() => openApproveDialog(u)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  )}
                  {showSuspend && u.status !== "SUSPENDED" && (
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
                  {u.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={actionLoading === u.id + "PENDING"}
                      onClick={() => updateStatus(u.id, "PENDING")}
                    >
                      {actionLoading === u.id + "PENDING" ? "Resetting…" : "Reset to Pending"}
                    </Button>
                  )}
                  {showSuspend && u.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-indigo-600"
                      onClick={() => openApproveDialog(u)}
                    >
                      Edit Brands
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Approvals</h1>
            <p className="text-gray-500 text-sm mt-1">
              Review applications, assign a SubID, and select which brands each partner can promote.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Partner Manually
          </Button>
        </div>

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
                {[
                  { value: "pending", label: "Pending", count: pending.length },
                  { value: "approved", label: "Approved" },
                  { value: "suspended", label: "Suspended" },
                ].map(({ value, label, count }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none pb-3 px-0 text-sm"
                  >
                    {label}
                    {count != null && count > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="pending" className="mt-0">
              <AffiliateTable users={pending} showApprove />
            </TabsContent>
            <TabsContent value="approved" className="mt-0">
              <AffiliateTable users={approved} showSuspend />
            </TabsContent>
            <TabsContent value="suspended" className="mt-0">
              <AffiliateTable users={suspended} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Approval Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Approve Partner</DialogTitle>
            <DialogDescription>
              Assign a SubID and select which brands{" "}
              <span className="font-semibold text-gray-900">{approveTarget?.name}</span> can promote.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* SubID input */}
            <div className="space-y-1.5">
              <Label htmlFor="subid" className="text-sm font-medium text-gray-700">
                Sub-Affiliate ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subid"
                placeholder="e.g. JOHN01"
                value={subIdInput}
                onChange={(e) => setSubIdInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="font-mono uppercase h-10"
                maxLength={20}
              />
              <p className="text-xs text-gray-400">
                Uppercase letters and numbers only. This becomes their tracking identifier.
              </p>
            </div>

            {/* Campaign picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Allowed Brands <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Select which Impact campaigns this partner can promote. They&apos;ll receive unique
                tracking links for each selected brand.
              </p>

              {campaignsLoading && (
                <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading your Impact campaigns…
                </div>
              )}

              {campaignsError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {campaignsError}
                </div>
              )}

              {!campaignsLoading && !campaignsError && (
                <div className="space-y-2">
                  {campaigns.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      No campaigns found in your Impact account.
                    </p>
                  )}
                  {campaigns.map((c) => {
                    const hasLink = !!c.trackingLink
                    const checked = selectedCampaignIds.has(c.campaignId)
                    return (
                      <div
                        key={c.campaignId}
                        className={`rounded-lg border transition-colors ${
                          !hasLink
                            ? "opacity-50 border-gray-100 bg-gray-50"
                            : checked
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-100 bg-white"
                        }`}
                      >
                        <label className={`flex items-start gap-3 p-3 ${hasLink ? "cursor-pointer" : "cursor-not-allowed"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!hasLink}
                            onChange={() => hasLink && toggleCampaign(c.campaignId)}
                            className="mt-0.5 accent-indigo-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900">{c.advertiserName}</p>
                              {!hasLink && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                  No link
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.campaignName}</p>
                            {hasLink && (
                              <a
                                href={c.advertiserUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {c.advertiserUrl}
                              </a>
                            )}
                          </div>
                        </label>

                        {/* Commission input — only visible when checked */}
                        {checked && hasLink && (
                          <div className="px-3 pb-3 flex items-center gap-2 border-t border-indigo-100 pt-2.5 mt-0">
                            <label className="text-xs text-indigo-700 font-medium whitespace-nowrap">
                              Commission for this affiliate:
                            </label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="e.g. 65"
                                value={campaignCommissions[c.campaignId] ?? ""}
                                onChange={(e) => setCommission(c.campaignId, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 w-20 text-sm text-center font-semibold"
                              />
                              <span className="text-sm font-semibold text-indigo-700">%</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              of Impact payout per sale
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
            <p className="text-xs text-gray-400">
              {selectedCampaignIds.size} brand{selectedCampaignIds.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveTarget(null)}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={approving || campaignsLoading}
                onClick={submitApproval}
              >
                {approving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Partner
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Partner Manually ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Add Partner Manually
            </DialogTitle>
            <DialogDescription>
              Creates an APPROVED affiliate account directly — bypasses the application queue.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Full name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Jane Smith"
                  value={createForm.name}
                  onChange={(e) => setCreateField("name", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Company <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="Company name"
                  value={createForm.company}
                  onChange={(e) => setCreateField("company", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="partner@example.com"
                value={createForm.email}
                onChange={(e) => setCreateField("email", e.target.value)}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  SubID <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. JANE01"
                  value={createForm.subIdCode}
                  onChange={(e) => setCreateField("subIdCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className="h-9 font-mono uppercase"
                  maxLength={20}
                />
                <p className="text-xs text-gray-400">Uppercase letters and numbers only</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Traffic source <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. paid_ads"
                  value={createForm.trafficSource}
                  onChange={(e) => setCreateField("trafficSource", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showCreatePw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateField("password", e.target.value)}
                  className="h-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCreatePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Share this with the partner so they can log in.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Media properties / platforms <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="e.g. Instagram @handle (200k), YouTube channel, finance blog at example.com…"
                value={createForm.mediaProperties}
                onChange={(e) => setCreateField("mediaProperties", e.target.value)}
                className="h-20 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={creating}
              onClick={submitCreate}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Create & Approve
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
