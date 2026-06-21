import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { role: "AFFILIATE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      trafficSource: true,
      status: true,
      subIdCode: true,
      createdAt: true,
      payoutMethod: true,
      _count: { select: { conversions: true } },
      conversions: {
        where: { status: { in: ["CLEARED", "LOCKED", "PENDING"] } },
        select: { affiliateEarning: true, status: true },
      },
    },
  })

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    company: u.company,
    trafficSource: u.trafficSource,
    status: u.status,
    subIdCode: u.subIdCode,
    payoutMethod: u.payoutMethod,
    createdAt: u.createdAt.toISOString(),
    totalConversions: u._count.conversions,
    totalEarnings: u.conversions.reduce((sum, c) => sum + Number(c.affiliateEarning), 0),
    clearedEarnings: u.conversions
      .filter((c) => c.status === "CLEARED")
      .reduce((sum, c) => sum + Number(c.affiliateEarning), 0),
  }))

  return NextResponse.json(serialized)
}
