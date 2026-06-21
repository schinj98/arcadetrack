import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const offerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  baseTrackingLink: z.string().url("Must be a valid URL"),
  payoutAmount: z.number().min(0, "Must be positive"),
  commissionSplitPercent: z.number().min(0).max(100, "Must be 0–100"),
  vertical: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversions: true, affiliateLinks: true } },
    },
  })

  const serialized = offers.map((o) => ({
    ...o,
    payoutAmount: Number(o.payoutAmount),
    commissionSplitPercent: Number(o.commissionSplitPercent),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }))

  return NextResponse.json(serialized)
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = offerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const offer = await prisma.offer.create({ data: parsed.data })

  return NextResponse.json(
    {
      ...offer,
      payoutAmount: Number(offer.payoutAmount),
      commissionSplitPercent: Number(offer.commissionSplitPercent),
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    },
    { status: 201 }
  )
}
