import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "AFFILIATE" || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [conversionGroups, recentConversions, monthlyConversions] = await Promise.all([
    prisma.conversion.groupBy({
      by: ["status"],
      where: { userId, removedByAdmin: false },
      _count: { _all: true },
      _sum: { affiliateEarning: true },
    }),
    prisma.conversion.findMany({
      where: { userId, removedByAdmin: false },
      orderBy: { actionDate: "desc" },
      take: 5,
      include: { offer: { select: { name: true, brand: true } } },
    }),
    prisma.conversion.findMany({
      where: { userId, status: "CLEARED", removedByAdmin: false, actionDate: { gte: sixMonthsAgo } },
      select: { actionDate: true, affiliateEarning: true },
    }),
  ])

  const statusMap: Record<string, { count: number; earnings: number }> = {}
  conversionGroups.forEach((g) => {
    statusMap[g.status] = { count: g._count._all, earnings: Number(g._sum.affiliateEarning ?? 0) }
  })

  const monthlyMap: Record<string, number> = {}
  monthlyConversions.forEach((c) => {
    const key = c.actionDate.toISOString().slice(0, 7)
    monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(c.affiliateEarning)
  })

  const chart = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    chart.push({
      month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      earnings: monthlyMap[d.toISOString().slice(0, 7)] ?? 0,
    })
  }

  return NextResponse.json({
    pending: statusMap.PENDING ?? { count: 0, earnings: 0 },
    locked: statusMap.LOCKED ?? { count: 0, earnings: 0 },
    cleared: statusMap.CLEARED ?? { count: 0, earnings: 0 },
    reversed: statusMap.REVERSED ?? { count: 0, earnings: 0 },
    totalConversions: conversionGroups.reduce((s, g) => s + g._count._all, 0),
    chart,
    recent: recentConversions.map((c) => ({
      id: c.id,
      status: c.status,
      actionDate: c.actionDate.toISOString(),
      affiliateEarning: Number(c.affiliateEarning),
      grossCommission: Number(c.grossCommission),
      saleAmount: Number(c.saleAmount),
      lockingDate: c.lockingDate?.toISOString() ?? null,
      clearingDate: c.clearingDate?.toISOString() ?? null,
      offer: c.offer,
    })),
  })
}
