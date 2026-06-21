import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DollarSign, CheckCircle2, Clock, ArrowRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"

export const metadata = { title: "Payouts — Partner Dashboard" }

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [payouts, clearedAgg, paidAgg] = await Promise.all([
    prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversion.aggregate({
      where: { userId, status: "CLEARED" },
      _sum: { affiliateEarning: true },
    }),
    prisma.payout.aggregate({
      where: { userId, status: "PAID" },
      _sum: { amount: true },
    }),
  ])

  const totalCleared = Number(clearedAgg._sum.affiliateEarning ?? 0)
  const totalPaid = Number(paidAgg._sum.amount ?? 0)
  const owed = Math.max(0, totalCleared - totalPaid)

  const steps = [
    {
      icon: "1",
      title: "Conversion Fires",
      desc: "Someone clicks your tracking link and completes a qualifying action (purchase, signup, etc.). Impact records the conversion and it appears here as PENDING.",
      color: "bg-amber-100 text-amber-700",
    },
    {
      icon: "2",
      title: "Locks In",
      desc: "After Impact validates the conversion (typically a few days), it becomes LOCKED. Locked earnings are confirmed but still within the advertiser's return window.",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: "3",
      title: "Clears",
      desc: "Once the lock period expires (usually 30 days), the conversion becomes CLEARED. Cleared earnings are fully confirmed and included in your next payout.",
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: "4",
      title: "You Get Paid",
      desc: "We calculate your total cleared earnings minus any previous payouts and send payment monthly. You'll see each payout recorded in the history below.",
      color: "bg-indigo-100 text-indigo-700",
    },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-500 text-sm mt-1">Your earnings summary and payment history.</p>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Cleared Earnings", value: totalCleared, color: "text-emerald-700", desc: "Ready to be paid" },
          { label: "Already Paid", value: totalPaid, color: "text-gray-700", desc: "All-time total" },
          { label: "Balance Owed", value: owed, color: owed > 0 ? "text-amber-700" : "text-gray-400", desc: owed > 0 ? "Due next cycle" : "All paid up" },
        ].map(({ label, value, color, desc }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Owed notice */}
      {owed > 0.01 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">
              {formatCurrency(owed)} will be included in your next payout
            </p>
            <p className="text-amber-700 mt-0.5">
              Payouts are processed monthly. Make sure your payout method is set up with your account manager.
            </p>
          </div>
        </div>
      )}

      {/* Payout history */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium mb-1">No payments yet</p>
              <p className="text-xs text-gray-400">Your first payout will appear here once processed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {formatCurrency(Number(p.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PAID" ? "cleared" : "pending"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {p.paidAt ? formatDate(p.paidAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">
                      {p.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How payouts work */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">How Payouts Work</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center shrink-0 font-bold text-sm`}>
                {step.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="self-center ml-auto shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion status explainer */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Conversion Status Guide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[
            { variant: "pending" as const, label: "PENDING", desc: "Recorded but not yet validated by Impact. No action needed from you." },
            { variant: "locked" as const, label: "LOCKED", desc: "Validated and confirmed. Waiting out the advertiser's return window." },
            { variant: "cleared" as const, label: "CLEARED", desc: "Fully confirmed. Will be included in your next payout." },
            { variant: "reversed" as const, label: "REVERSED", desc: "Commission reversed (e.g., refund or fraud). Deducted from earnings." },
          ].map(({ variant, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Badge variant={variant}>{label}</Badge>
              <p className="text-xs text-gray-600">{desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
