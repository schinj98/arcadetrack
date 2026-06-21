"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DollarSign, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface AffiliateOwed {
  id: string
  name: string
  email: string
  subIdCode: string | null
  payoutMethod: string | null
  totalCleared: number
  totalPaid: number
  owed: number
  payouts: {
    id: string; amount: number; status: string; createdAt: string; paidAt: string | null
  }[]
}

const payoutSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  periodStart: z.string().min(1, "Required"),
  periodEnd: z.string().min(1, "Required"),
  notes: z.string().optional(),
})
type PayoutValues = z.infer<typeof payoutSchema>

export default function PayoutsPage() {
  const [data, setData] = useState<AffiliateOwed[]>([])
  const [loading, setLoading] = useState(true)
  const [payingFor, setPayingFor] = useState<AffiliateOwed | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<PayoutValues>({ resolver: zodResolver(payoutSchema) })

  async function fetchData() {
    const res = await fetch("/api/admin/payouts")
    setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openPayDialog(affiliate: AffiliateOwed) {
    setPayingFor(affiliate)
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    form.reset({ amount: affiliate.owed, periodStart: firstOfMonth, periodEnd: today, notes: "" })
  }

  async function onSubmit(values: PayoutValues) {
    if (!payingFor) return
    setSaving(true)
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, userId: payingFor.id, periodStart: new Date(values.periodStart).toISOString(), periodEnd: new Date(values.periodEnd).toISOString() }),
    })
    setSaving(false)

    if (res.ok) {
      toast.success(`Payout of ${formatCurrency(values.amount)} marked for ${payingFor.name}`)
      setPayingFor(null)
      fetchData()
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Failed to record payout")
    }
  }

  const owedAffiliates = data.filter((a) => a.owed > 0.01)
  const allPayouts = data
    .flatMap((a) => a.payouts.map((p) => ({ ...p, affiliateName: a.name, affiliateEmail: a.email })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track cleared earnings and record payouts to affiliates.
        </p>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Owed</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(data.reduce((s, a) => s + a.owed, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Paid (all time)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatCurrency(data.reduce((s, a) => s + a.totalPaid, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Affiliates Owed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{owedAffiliates.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Tabs defaultValue="owed">
          <div className="px-6 pt-4 border-b border-gray-100">
            <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none">
              {["owed", "history"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 data-[state=active]:shadow-none pb-3 px-0 text-sm capitalize"
                >
                  {tab === "owed" ? "Affiliates Owed" : "Payout History"}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="owed" className="mt-0">
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
            ) : owedAffiliates.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">All affiliates are paid up — nothing owed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Cleared Earnings</TableHead>
                    <TableHead>Already Paid</TableHead>
                    <TableHead>Owed</TableHead>
                    <TableHead>Payout Method</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owedAffiliates.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-semibold text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                        {a.subIdCode && (
                          <span className="font-mono text-xs text-gray-400">{a.subIdCode}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(a.totalCleared)}</TableCell>
                      <TableCell className="text-gray-600">{formatCurrency(a.totalPaid)}</TableCell>
                      <TableCell>
                        <span className="font-bold text-amber-700">{formatCurrency(a.owed)}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{a.payoutMethod ?? "Not set"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                          onClick={() => openPayDialog(a)}
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" /> Mark as Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
            ) : allPayouts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No payouts recorded yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.createdAt)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{p.affiliateName}</p>
                        <p className="text-xs text-gray-400">{p.affiliateEmail}</p>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "PAID" ? "cleared" : "pending"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {p.paidAt ? formatDate(p.paidAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mark as Paid dialog */}
      <Dialog open={!!payingFor} onOpenChange={() => setPayingFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Recording payment to{" "}
              <span className="font-semibold text-gray-900">{payingFor?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="periodStart" render={({ field }) => (
                  <FormItem><FormLabel>Period Start</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="periodEnd" render={({ field }) => (
                  <FormItem><FormLabel>Period End</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="e.g. PayPal payment, invoice #..." rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPayingFor(null)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                  {saving ? "Recording…" : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
