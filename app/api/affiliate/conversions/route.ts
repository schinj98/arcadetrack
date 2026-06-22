import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "AFFILIATE" || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const conversions = await prisma.conversion.findMany({
    where: { userId: session.user.id, removedByAdmin: false },
    orderBy: { actionDate: "desc" },
    take: 500, // cap to prevent unbounded memory usage
    include: { offer: { select: { name: true, brand: true } } },
  })

  return NextResponse.json(
    conversions.map((c) => ({
      id: c.id,
      status: c.status,
      actionDate: c.actionDate.toISOString(),
      affiliateEarning: Number(c.affiliateEarning),
      grossCommission: Number(c.grossCommission),
      saleAmount: Number(c.saleAmount),
      lockingDate: c.lockingDate?.toISOString() ?? null,
      clearingDate: c.clearingDate?.toISOString() ?? null,
      syncedAt: c.syncedAt.toISOString(),
      offer: c.offer,
    }))
  )
}
