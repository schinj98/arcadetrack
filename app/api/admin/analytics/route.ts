import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const offerId = searchParams.get("offerId") || undefined

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (dateFrom) dateFilter.gte = new Date(dateFrom)
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    dateFilter.lte = end
  }

  const baseWhere = {
    removedByAdmin: false,
    ...(Object.keys(dateFilter).length > 0 ? { actionDate: dateFilter } : {}),
    ...(offerId ? { offerId } : {}),
  }

  const [
    conversionsByStatus,
    conversionsByOffer,
    conversionsByAffiliate,
    conversionsByDay,
    offers,
  ] = await Promise.all([
    // Totals by status
    prisma.conversion.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
      _sum: { grossCommission: true, affiliateEarning: true, saleAmount: true },
    }),

    // Breakdown by offer/brand
    prisma.conversion.groupBy({
      by: ["offerId", "status"],
      where: baseWhere,
      _count: { _all: true },
      _sum: { grossCommission: true, affiliateEarning: true },
    }),

    // Top affiliates
    prisma.conversion.groupBy({
      by: ["userId"],
      where: baseWhere,
      _count: { _all: true },
      _sum: { grossCommission: true, affiliateEarning: true },
      orderBy: { _sum: { grossCommission: "desc" } },
      take: 10,
    }),

    // Daily conversion counts (last portion)
    prisma.conversion.findMany({
      where: baseWhere,
      select: { actionDate: true, status: true, grossCommission: true, affiliateEarning: true },
      orderBy: { actionDate: "asc" },
    }),

    // All offers for filter dropdown
    prisma.offer.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, brand: true },
      orderBy: { brand: "asc" },
    }),
  ])

  // Resolve affiliate names
  const affiliateIds = conversionsByAffiliate.map((a) => a.userId)
  const affiliateUsers = await prisma.user.findMany({
    where: { id: { in: affiliateIds } },
    select: { id: true, name: true, email: true, subIdCode: true },
  })
  const affiliateMap = new Map(affiliateUsers.map((u) => [u.id, u]))

  // Resolve offer details for breakdown
  const usedOfferIds = [...new Set(conversionsByOffer.map((c) => c.offerId).filter(Boolean))] as string[]
  const usedOffers = await prisma.offer.findMany({
    where: { id: { in: usedOfferIds } },
    select: { id: true, name: true, brand: true },
  })
  const offerMap = new Map(usedOffers.map((o) => [o.id, o]))

  // Aggregate offer breakdown (collapse status)
  const offerAgg: Record<string, {
    offerId: string | null; brand: string; name: string
    pending: number; locked: number; cleared: number; reversed: number
    grossCommission: number; affiliateEarning: number; count: number
  }> = {}

  for (const row of conversionsByOffer) {
    const key = row.offerId ?? "__unknown__"
    if (!offerAgg[key]) {
      const offer = row.offerId ? offerMap.get(row.offerId) : null
      offerAgg[key] = {
        offerId: row.offerId,
        brand: offer?.brand ?? "Unknown",
        name: offer?.name ?? "Unknown",
        pending: 0, locked: 0, cleared: 0, reversed: 0,
        grossCommission: 0, affiliateEarning: 0, count: 0,
      }
    }
    const st = row.status.toLowerCase() as "pending" | "locked" | "cleared" | "reversed"
    offerAgg[key][st] += row._count._all
    offerAgg[key].grossCommission += Number(row._sum.grossCommission ?? 0)
    offerAgg[key].affiliateEarning += Number(row._sum.affiliateEarning ?? 0)
    offerAgg[key].count += row._count._all
  }

  // Daily chart data — bucket by date
  const dailyMap: Record<string, { date: string; count: number; grossCommission: number }> = {}
  for (const c of conversionsByDay) {
    const key = c.actionDate.toISOString().slice(0, 10)
    if (!dailyMap[key]) dailyMap[key] = { date: key, count: 0, grossCommission: 0 }
    dailyMap[key].count++
    dailyMap[key].grossCommission += Number(c.grossCommission)
  }

  // Totals
  const totals = {
    conversions: 0,
    grossCommission: 0,
    affiliateEarning: 0,
    saleAmount: 0,
    pending: 0,
    locked: 0,
    cleared: 0,
    reversed: 0,
  }
  for (const g of conversionsByStatus) {
    totals.conversions += g._count._all
    totals.grossCommission += Number(g._sum.grossCommission ?? 0)
    totals.affiliateEarning += Number(g._sum.affiliateEarning ?? 0)
    totals.saleAmount += Number(g._sum.saleAmount ?? 0)
    const st = g.status.toLowerCase() as keyof typeof totals
    if (st in totals) (totals as Record<string, number>)[st] = g._count._all
  }

  return NextResponse.json({
    totals,
    offerBreakdown: Object.values(offerAgg).sort((a, b) => b.grossCommission - a.grossCommission),
    topAffiliates: conversionsByAffiliate.map((a) => ({
      userId: a.userId,
      user: affiliateMap.get(a.userId) ?? null,
      count: a._count._all,
      grossCommission: Number(a._sum.grossCommission ?? 0),
      affiliateEarning: Number(a._sum.affiliateEarning ?? 0),
    })),
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    offers,
  })
}
