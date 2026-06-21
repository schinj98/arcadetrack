import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === "ADMIN" ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Affiliates with cleared earnings vs paid out
  const affiliates = await prisma.user.findMany({
    where: { role: "AFFILIATE", status: "APPROVED" },
    select: {
      id: true,
      name: true,
      email: true,
      subIdCode: true,
      payoutMethod: true,
      conversions: {
        where: { status: "CLEARED" },
        select: { affiliateEarning: true },
      },
      payouts: {
        select: { amount: true, status: true, createdAt: true, paidAt: true, id: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const result = affiliates.map((a) => {
    const totalCleared = a.conversions.reduce(
      (sum, c) => sum + Number(c.affiliateEarning),
      0
    )
    const totalPaid = a.payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount), 0)

    return {
      id: a.id,
      name: a.name,
      email: a.email,
      subIdCode: a.subIdCode,
      payoutMethod: a.payoutMethod,
      totalCleared,
      totalPaid,
      owed: Math.max(0, totalCleared - totalPaid),
      payouts: a.payouts.map((p) => ({
        ...p,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    }
  })

  return NextResponse.json(result)
}

const createSchema = z.object({
  userId: z.string(),
  amount: z.number().min(0.01, "Amount must be positive"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { userId, amount, periodStart, periodEnd, notes } = parsed.data

  // Verify the target is an approved affiliate — prevents paying out to admin accounts
  // or non-existent users via forged userId values
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser || targetUser.role !== "AFFILIATE" || targetUser.status !== "APPROVED") {
    return NextResponse.json({ error: "Invalid affiliate" }, { status: 400 })
  }

  const payout = await prisma.payout.create({
    data: {
      userId,
      amount,
      status: "PAID",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      notes: notes ?? null,
      paidAt: new Date(),
    },
  })

  return NextResponse.json(
    { ...payout, amount: Number(payout.amount), createdAt: payout.createdAt.toISOString() },
    { status: 201 }
  )
}
