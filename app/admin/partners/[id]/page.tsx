import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Building2, Zap, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PartnerBrands } from "@/components/admin/partner-brands"
import { PartnerConversions } from "@/components/admin/partner-conversions"

export const metadata = { title: "Partner Drilldown" }

const trafficLabels: Record<string, string> = {
  social_media: "Social Media", paid_ads: "Paid Ads", seo_content: "SEO / Content",
  youtube: "YouTube", email: "Email", podcast: "Podcast", influencer: "Influencer", other: "Other",
}

export default async function PartnerDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      conversions: {
        orderBy: { actionDate: "desc" },
        take: 100,
        include: { offer: { select: { name: true, brand: true } } },
      },
      payouts: { orderBy: { createdAt: "desc" } },
      affiliateLinks: {
        include: { offer: { select: { name: true, brand: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { conversions: true } },
    },
  })

  if (!user || user.role !== "AFFILIATE") notFound()

  const activeConversions = user.conversions.filter((c) => !c.removedByAdmin)
  const stats = {
    pending: activeConversions.filter((c) => c.status === "PENDING").reduce((s, c) => s + Number(c.affiliateEarning), 0),
    locked: activeConversions.filter((c) => c.status === "LOCKED").reduce((s, c) => s + Number(c.affiliateEarning), 0),
    cleared: activeConversions.filter((c) => c.status === "CLEARED").reduce((s, c) => s + Number(c.affiliateEarning), 0),
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/partners"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Partners
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex items-center flex-wrap gap-3 mt-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </span>
              {user.company && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {user.company}
                </span>
              )}
              {user.trafficSource && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {trafficLabels[user.trafficSource] ?? user.trafficSource}
                </span>
              )}
              <Badge variant={user.status === "APPROVED" ? "approved" : user.status === "SUSPENDED" ? "suspended" : "pending"}>
                {user.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* SubID + metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">SubID Code</p>
          <p className="font-mono text-sm font-bold text-gray-900 mt-1">{user.subIdCode ?? "Not assigned"}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Joined</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(user.createdAt)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Total Conversions</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{user._count.conversions}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Payout Method</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{user.payoutMethod ?? "Not set"}</p>
        </div>
      </div>

      {/* Media properties */}
      {user.mediaProperties && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex gap-3">
          <Monitor className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Promoting on / Media Properties</p>
            <p className="text-sm text-gray-800 whitespace-pre-line">{user.mediaProperties}</p>
          </div>
        </div>
      )}

      {/* Earnings breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Earnings", value: stats.pending, variant: "amber" },
          { label: "Locked Earnings", value: stats.locked, variant: "blue" },
          { label: "Cleared Earnings", value: stats.cleared, variant: "emerald" },
        ].map(({ label, value, variant }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${variant === "amber" ? "text-amber-700" : variant === "blue" ? "text-blue-700" : "text-emerald-700"}`}>
                {formatCurrency(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assigned Brands & Commission */}
      <PartnerBrands
        userId={user.id}
        initialLinks={user.affiliateLinks.map((l) => ({
          id: l.id,
          offerId: l.offerId,
          fullTrackingLink: l.fullTrackingLink,
          commissionSplitPercent: Number(l.commissionSplitPercent),
          offer: l.offer,
        }))}
      />

      {/* Conversions table — client component with remove capability */}
      <PartnerConversions
        initialConversions={user.conversions.map((c) => ({
          id: c.id,
          status: c.status,
          actionDate: c.actionDate,
          saleAmount: Number(c.saleAmount),
          affiliateEarning: Number(c.affiliateEarning),
          grossCommission: Number(c.grossCommission),
          lockingDate: c.lockingDate,
          clearingDate: c.clearingDate,
          removedByAdmin: c.removedByAdmin,
          adminNote: c.adminNote,
          offer: c.offer,
        }))}
      />

      {/* Payout history */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {user.payouts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No payouts yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Created</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PAID" ? "cleared" : "pending"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {p.paidAt ? formatDate(p.paidAt) : "—"}
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
