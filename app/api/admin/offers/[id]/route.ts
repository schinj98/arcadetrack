import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  baseTrackingLink: z.string().url().optional(),
  payoutAmount: z.number().min(0).optional(),
  commissionSplitPercent: z.number().min(0).max(100).optional(),
  vertical: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === "ADMIN" ? session : null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const offer = await prisma.offer.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({
    ...offer,
    payoutAmount: Number(offer.payoutAmount),
    commissionSplitPercent: Number(offer.commissionSplitPercent),
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await prisma.offer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
