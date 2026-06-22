"use client"

import { useState } from "react"
import { Pencil, Trash2, Check, X, Plus, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface BrandLink {
  id: string
  offerId: string
  fullTrackingLink: string
  commissionSplitPercent: number
  offer: { name: string; brand: string }
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

export function PartnerBrands({
  userId,
  initialLinks,
}: {
  userId: string
  initialLinks: BrandLink[]
}) {
  const [links, setLinks] = useState<BrandLink[]>(initialLinks)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editLinkValue, setEditLinkValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  // Add brand dialog
  const [addOpen, setAddOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<ImpactCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<ImpactCampaign | null>(null)
  const [newCommission, setNewCommission] = useState("")
  const [adding, setAdding] = useState(false)

  async function startEdit(link: BrandLink) {
    setEditingId(link.id)
    setEditValue(String(link.commissionSplitPercent))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue("")
  }

  function startEditLink(link: BrandLink) {
    setEditingLinkId(link.id)
    setEditLinkValue(link.fullTrackingLink)
  }

  function cancelEditLink() {
    setEditingLinkId(null)
    setEditLinkValue("")
  }

  async function saveLink(linkId: string) {
    const url = editLinkValue.trim()
    if (!url.startsWith("http")) {
      toast.error("Must be a valid URL starting with http")
      return
    }
    setSaving(linkId + "_link")
    const res = await fetch(`/api/admin/affiliate-links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullTrackingLink: url }),
    })
    setSaving(null)
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, fullTrackingLink: url } : l))
      )
      setEditingLinkId(null)
      toast.success("Tracking link updated")
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Update failed")
    }
  }

  async function saveCommission(linkId: string) {
    const pct = parseFloat(editValue)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a number between 0 and 100")
      return
    }
    setSaving(linkId)
    const res = await fetch(`/api/admin/affiliate-links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionSplitPercent: pct }),
    })
    setSaving(null)
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, commissionSplitPercent: pct } : l))
      )
      setEditingId(null)
      toast.success("Commission updated")
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Update failed")
    }
  }

  async function removeLink(linkId: string) {
    setSaving(linkId)
    const res = await fetch(`/api/admin/affiliate-links/${linkId}`, { method: "DELETE" })
    setSaving(null)
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId))
      toast.success("Brand removed")
    } else {
      toast.error("Failed to remove brand")
    }
  }

  async function openAddDialog() {
    setAddOpen(true)
    setSelectedCampaign(null)
    setNewCommission("")
    if (campaigns.length === 0) {
      setCampaignsLoading(true)
      const res = await fetch("/api/admin/impact-campaigns")
      const data = await res.json()
      setCampaigns(Array.isArray(data) ? data : [])
      setCampaignsLoading(false)
    }
  }

  async function addBrand() {
    if (!selectedCampaign) { toast.error("Select a campaign"); return }
    if (!selectedCampaign.trackingLink) { toast.error("This campaign has no tracking link"); return }
    const pct = parseFloat(newCommission)
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Enter commission between 0–100"); return }

    setAdding(true)
    const res = await fetch("/api/admin/affiliate-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        campaignId: selectedCampaign.campaignId,
        campaignName: selectedCampaign.campaignName,
        advertiserName: selectedCampaign.advertiserName,
        trackingLink: selectedCampaign.trackingLink,
        commissionSplitPercent: pct,
      }),
    })
    setAdding(false)
    if (res.ok) {
      const newLink = await res.json()
      setLinks((prev) => [...prev, newLink])
      setAddOpen(false)
      toast.success(`${selectedCampaign.advertiserName} added`)
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Failed to add brand")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Assigned Brands & Commission</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The commission % here is this affiliate&apos;s personal rate — it overrides any global offer setting.
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openAddDialog}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Brand
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No brands assigned — click &quot;Add Brand&quot; to grant access
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Brand</th>
              <th className="px-6 py-3 text-left">Commission</th>
              <th className="px-6 py-3 text-left">Tracking Link</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">{link.offer.brand}</p>
                  <p className="text-xs text-gray-400">{link.offer.name}</p>
                </td>
                <td className="px-6 py-3">
                  {editingId === link.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-20 text-sm text-center font-semibold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCommission(link.id)
                          if (e.key === "Escape") cancelEdit()
                        }}
                      />
                      <span className="text-sm font-semibold text-gray-600">%</span>
                      <button
                        onClick={() => saveCommission(link.id)}
                        disabled={saving === link.id}
                        className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      >
                        {saving === link.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(link)}
                      className="flex items-center gap-1.5 group"
                    >
                      <span className="text-lg font-bold text-indigo-700">
                        {link.commissionSplitPercent}%
                      </span>
                      <Pencil className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  )}
                </td>
                <td className="px-6 py-3">
                  {editingLinkId === link.id ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Input
                        value={editLinkValue}
                        onChange={(e) => setEditLinkValue(e.target.value)}
                        className="h-7 text-xs font-mono w-64"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveLink(link.id)
                          if (e.key === "Escape") cancelEditLink()
                        }}
                      />
                      <button
                        onClick={() => saveLink(link.id)}
                        disabled={saving === link.id + "_link"}
                        className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50 shrink-0"
                      >
                        {saving === link.id + "_link" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={cancelEditLink} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <a
                        href={link.fullTrackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-mono truncate max-w-[180px]"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.fullTrackingLink}</span>
                      </a>
                      <button
                        onClick={() => startEditLink(link)}
                        className="text-gray-200 group-hover:text-indigo-400 transition-colors shrink-0"
                        title="Edit tracking link"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => removeLink(link.id)}
                    disabled={saving === link.id}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Remove brand access"
                  >
                    {saving === link.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Brand Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Brand Access</DialogTitle>
            <DialogDescription>
              Select a campaign and set the commission rate for this affiliate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Campaign picker */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Campaign</label>
              {campaignsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {campaigns
                    .filter((c) => c.trackingLink)
                    .map((c) => {
                      const alreadyAssigned = links.some((l) => l.offer.brand.toLowerCase() === c.advertiserName.toLowerCase())
                      return (
                        <label
                          key={c.campaignId}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            alreadyAssigned
                              ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50"
                              : selectedCampaign?.campaignId === c.campaignId
                                ? "border-indigo-300 bg-indigo-50"
                                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="campaign"
                            disabled={alreadyAssigned}
                            checked={selectedCampaign?.campaignId === c.campaignId}
                            onChange={() => !alreadyAssigned && setSelectedCampaign(c)}
                            className="accent-indigo-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{c.advertiserName}</p>
                            <p className="text-xs text-gray-400 truncate">{c.campaignName}</p>
                          </div>
                          {alreadyAssigned && (
                            <span className="text-xs text-gray-400 shrink-0">Already assigned</span>
                          )}
                        </label>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Commission input */}
            {selectedCampaign && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Commission for this affiliate
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 65"
                    value={newCommission}
                    onChange={(e) => setNewCommission(e.target.value)}
                    className="h-9 w-24 text-center font-semibold"
                    autoFocus
                  />
                  <span className="font-semibold text-gray-700">%</span>
                  <span className="text-xs text-gray-400">of Impact payout per conversion</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={addBrand}
                disabled={adding || !selectedCampaign}
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add Brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
