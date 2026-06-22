"use client"

import { useState } from "react"
import { ShieldX, ShieldCheck, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Conversion {
  id: string
  status: string
  actionDate: string | Date
  saleAmount: number
  affiliateEarning: number
  grossCommission: number
  lockingDate: string | Date | null
  clearingDate: string | Date | null
  removedByAdmin: boolean
  adminNote: string | null
  offer: { name: string; brand: string } | null
}

const statusVariant: Record<string, "pending" | "locked" | "cleared" | "reversed"> = {
  PENDING: "pending", LOCKED: "locked", CLEARED: "cleared", REVERSED: "reversed",
}

export function PartnerConversions({ initialConversions }: { initialConversions: Conversion[] }) {
  const [conversions, setConversions] = useState<Conversion[]>(initialConversions)
  const [showRemoved, setShowRemoved] = useState(false)

  // Remove dialog state
  const [removeTarget, setRemoveTarget] = useState<Conversion | null>(null)
  const [noteInput, setNoteInput] = useState("")
  const [saving, setSaving] = useState(false)

  async function submitRemove() {
    if (!removeTarget) return
    setSaving(true)
    const res = await fetch(`/api/admin/conversions/${removeTarget.id}/remove`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removed: true, note: noteInput.trim() || undefined }),
    })
    setSaving(false)
    if (res.ok) {
      setConversions((prev) =>
        prev.map((c) =>
          c.id === removeTarget.id
            ? { ...c, removedByAdmin: true, adminNote: noteInput.trim() || null }
            : c
        )
      )
      toast.success("Conversion removed from affiliate view")
      setRemoveTarget(null)
      setNoteInput("")
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Failed to remove conversion")
    }
  }

  async function restoreConversion(id: string) {
    const res = await fetch(`/api/admin/conversions/${id}/remove`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removed: false }),
    })
    if (res.ok) {
      setConversions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, removedByAdmin: false, adminNote: null } : c))
      )
      toast.success("Conversion restored")
    } else {
      toast.error("Failed to restore conversion")
    }
  }

  const visible = conversions.filter((c) => showRemoved || !c.removedByAdmin)
  const removedCount = conversions.filter((c) => c.removedByAdmin).length

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">Recent Conversions</h2>
            {removedCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {removedCount} conversion{removedCount !== 1 ? "s" : ""} hidden from affiliate
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {removedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowRemoved((v) => !v)}
              >
                {showRemoved ? "Hide removed" : `Show removed (${removedCount})`}
              </Button>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No conversions yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Date</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Their Earning</TableHead>
                <TableHead>Gross Commission</TableHead>
                <TableHead>Lock Date</TableHead>
                <TableHead>Clear Date</TableHead>
                <TableHead className="text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((c) => (
                <TableRow
                  key={c.id}
                  className={c.removedByAdmin ? "opacity-40 bg-red-50/30" : undefined}
                >
                  <TableCell className="text-sm">{formatDate(c.actionDate)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{c.offer?.name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-400">{c.offer?.brand}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.removedByAdmin ? (
                      <Badge variant="reversed">Removed</Badge>
                    ) : (
                      <Badge variant={statusVariant[c.status] ?? "default"}>{c.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(c.saleAmount)}</TableCell>
                  <TableCell className="font-semibold text-emerald-700">
                    {c.status === "REVERSED" ? (
                      <span className="text-red-600">-{formatCurrency(c.affiliateEarning)}</span>
                    ) : (
                      formatCurrency(c.affiliateEarning)
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">{formatCurrency(c.grossCommission)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(c.lockingDate)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(c.clearingDate)}</TableCell>
                  <TableCell className="text-right">
                    {c.removedByAdmin ? (
                      <button
                        onClick={() => restoreConversion(c.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 ml-auto"
                        title={c.adminNote ? `Note: ${c.adminNote}` : "Restore conversion"}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => { setRemoveTarget(c); setNoteInput("") }}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 ml-auto transition-colors"
                        title="Remove from affiliate view"
                      >
                        <ShieldX className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Remove Conversion
            </DialogTitle>
            <DialogDescription>
              This removes the conversion from the affiliate&apos;s view and earnings. Impact.com is
              NOT affected — this is local only. You can restore it any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {removeTarget && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-gray-500">Offer:</span> <span className="font-medium">{removeTarget.offer?.brand ?? "Unknown"}</span></p>
                <p><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(removeTarget.actionDate)}</span></p>
                <p><span className="text-gray-500">Their Earning:</span> <span className="font-medium text-red-600">{formatCurrency(removeTarget.affiliateEarning)}</span> will be hidden</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Reason / Note <span className="text-gray-400 font-normal">(optional, internal only)</span>
              </label>
              <Textarea
                placeholder="e.g. Suspicious activity, chargeback risk…"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="h-24 text-sm resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRemoveTarget(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={submitRemove}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing…</span>
                ) : (
                  <span className="flex items-center gap-1.5"><ShieldX className="w-3.5 h-3.5" /> Remove Conversion</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
