"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, Tag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Offer {
  id: string
  name: string
  brand: string
  baseTrackingLink: string
  payoutAmount: number
  commissionSplitPercent: number
  vertical: string | null
  description: string | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  _count: { conversions: number; affiliateLinks: number }
}

const offerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  baseTrackingLink: z.string().url("Must be a valid URL"),
  payoutAmount: z.coerce.number().min(0, "Must be positive"),
  commissionSplitPercent: z.coerce.number().min(0).max(100, "Must be 0–100"),
  vertical: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})
type OfferValues = z.infer<typeof offerSchema>

const verticals = ["Finance", "eCommerce", "Health & Wellness", "SaaS", "Travel", "Fashion", "Gaming", "Education", "Other"]

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<OfferValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { name: "", brand: "", baseTrackingLink: "", payoutAmount: 0, commissionSplitPercent: 50, vertical: "", description: "", status: "ACTIVE" },
  })

  async function fetchOffers() {
    const res = await fetch("/api/admin/offers")
    setOffers(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchOffers() }, [])

  function openCreate() {
    setEditingOffer(null)
    form.reset({ name: "", brand: "", baseTrackingLink: "", payoutAmount: 0, commissionSplitPercent: 50, vertical: "", description: "", status: "ACTIVE" })
    setDialogOpen(true)
  }

  function openEdit(offer: Offer) {
    setEditingOffer(offer)
    form.reset({
      name: offer.name, brand: offer.brand, baseTrackingLink: offer.baseTrackingLink,
      payoutAmount: offer.payoutAmount, commissionSplitPercent: offer.commissionSplitPercent,
      vertical: offer.vertical ?? "", description: offer.description ?? "", status: offer.status,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: OfferValues) {
    setSaving(true)
    const url = editingOffer ? `/api/admin/offers/${editingOffer.id}` : "/api/admin/offers"
    const method = editingOffer ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    setSaving(false)

    if (res.ok) {
      toast.success(editingOffer ? "Offer updated" : "Offer created")
      setDialogOpen(false)
      fetchOffers()
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Failed to save offer")
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/admin/offers/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteId(null)

    if (res.ok) { toast.success("Offer deleted"); fetchOffers() }
    else toast.error("Failed to delete offer")
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your affiliate offers and commission splits.</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> New Offer
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading offers…</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-4">No offers yet</p>
            <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Create your first offer
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Offer</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Payout (my cut)</TableHead>
                <TableHead>Sub-aff Split</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Links / Conversions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{o.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{o.baseTrackingLink}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{o.brand}</TableCell>
                  <TableCell className="font-semibold text-gray-800">{formatCurrency(o.payoutAmount)}</TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-indigo-700">{o.commissionSplitPercent}%</span>
                    <span className="text-xs text-gray-400 ml-1">
                      → {formatCurrency(o.payoutAmount * o.commissionSplitPercent / 100)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{o.vertical ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-gray-700">{o._count.affiliateLinks} links</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-700">{o._count.conversions} conv.</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.status === "ACTIVE" ? "cleared" : "secondary"}>
                      {o.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(o)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(o.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Offer" : "Create New Offer"}</DialogTitle>
            <DialogDescription>
              {editingOffer ? "Update the offer details below." : "Add a new affiliate offer with commission settings."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Offer Name</FormLabel><FormControl><Input placeholder="Nike Running Shoes" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="Nike" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="baseTrackingLink" render={({ field }) => (
                <FormItem><FormLabel>Base Tracking Link (Impact URL)</FormLabel><FormControl><Input placeholder="https://track.impact.com/..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="payoutAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>My Payout ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="45.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="commissionSplitPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-affiliate Split (%)</FormLabel>
                    <FormControl><Input type="number" step="1" min="0" max="100" placeholder="60" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vertical" render={({ field }) => (
                  <FormItem><FormLabel>Vertical</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select vertical" /></SelectTrigger></FormControl>
                      <SelectContent>{verticals.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="Describe this offer…" rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                  {saving ? "Saving…" : editingOffer ? "Save Changes" : "Create Offer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete offer?</DialogTitle>
            <DialogDescription>
              This will permanently delete the offer and all associated affiliate links. Existing conversion records will be preserved with a null offer reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
