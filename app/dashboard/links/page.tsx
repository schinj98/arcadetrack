import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Link2, ExternalLink, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/dashboard/copy-button"
import { formatCurrency } from "@/lib/utils"

export const metadata = { title: "My Links — Partner Dashboard" }

function buildTrackingLink(baseUrl: string, subIdCode: string): string {
  const sep = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${sep}PubSubid1=${subIdCode}`
}

export default async function LinksPage() {
  const session = await getServerSession(authOptions)
  const subIdCode = session!.user.subIdCode

  if (!subIdCode) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">SubID not assigned yet</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your tracking links will appear here once your SubID is assigned. This happens automatically
              when your account is approved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Only show offers this affiliate has been granted access to
  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: { userId: session!.user.id },
    include: { offer: true },
    orderBy: { createdAt: "asc" },
  })
  const offers = affiliateLinks
    .filter((al) => al.offer.status === "ACTIVE")
    .map((al) => ({
      ...al.offer,
      fullTrackingLink: al.fullTrackingLink,
      myCommissionPct: Number(al.commissionSplitPercent),
    }))

  const conversionsByOffer = await prisma.conversion.groupBy({
    by: ["offerId", "status"],
    where: { userId: session!.user.id, removedByAdmin: false },
    _sum: { affiliateEarning: true },
    _count: { _all: true },
  })

  const offerStats: Record<string, {
    totalConversions: number
    totalEarnings: number
    cleared: number
  }> = {}

  conversionsByOffer.forEach((g) => {
    if (!g.offerId) return
    if (!offerStats[g.offerId]) offerStats[g.offerId] = { totalConversions: 0, totalEarnings: 0, cleared: 0 }
    offerStats[g.offerId].totalConversions += g._count._all
    offerStats[g.offerId].totalEarnings += Number(g._sum.affiliateEarning ?? 0)
    if (g.status === "CLEARED") offerStats[g.offerId].cleared += Number(g._sum.affiliateEarning ?? 0)
  })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tracking Links</h1>
        <p className="text-gray-500 text-sm mt-1">
          Share these links to earn commissions. Your SubID{" "}
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 text-xs">
            {subIdCode}
          </span>{" "}
          is embedded so your conversions are tracked automatically.
        </p>
      </div>

      {/* How it works banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Link2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-800">
            <p className="font-semibold">How tracking works</p>
            <p className="mt-0.5 text-indigo-700">
              Each link below has your unique SubID appended as a URL parameter. When someone clicks your link
              and converts, Impact records it under your SubID. We then sync that data here and calculate your
              commission based on the split percentage for that offer.
            </p>
          </div>
        </div>
      </div>

      {/* Offers */}
      {offers.length === 0 ? (
        <div className="text-center py-16">
          <Link2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No brands assigned yet — contact your account manager</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const trackingLink = offer.fullTrackingLink || buildTrackingLink(offer.baseTrackingLink, subIdCode)
            const myPayout = Number(offer.payoutAmount) * (offer.myCommissionPct / 100)
            const stats = offerStats[offer.id] ?? { totalConversions: 0, totalEarnings: 0, cleared: 0 }

            return (
              <Card key={offer.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  {/* Offer header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-900">{offer.name}</h3>
                        <Badge variant="cleared">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{offer.brand}</p>
                      {offer.vertical && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {offer.vertical}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500 mb-0.5">Your payout per conversion</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(myPayout)}</p>
                      <p className="text-xs text-gray-400">{offer.myCommissionPct}% of {formatCurrency(Number(offer.payoutAmount))}</p>
                    </div>
                  </div>

                  {offer.description && (
                    <p className="text-sm text-gray-600 mb-4">{offer.description}</p>
                  )}

                  {/* Tracking link */}
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Your tracking link</p>
                      <p className="text-xs font-mono text-gray-700 truncate">{trackingLink}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton text={trackingLink} label="Copy Link" />
                      <a
                        href={trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-md px-2.5 py-1.5 h-8 hover:border-indigo-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Test
                      </a>
                    </div>
                  </div>

                  {/* Performance stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Your Conversions", value: stats.totalConversions.toLocaleString() },
                      { label: "Total Earned", value: formatCurrency(stats.totalEarnings) },
                      { label: "Cleared Earnings", value: formatCurrency(stats.cleared) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center bg-white border border-gray-100 rounded-lg py-2.5 px-3">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
