import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "AFFILIATE" || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payouts = await prisma.payout.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    payouts.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }))
  )
}
