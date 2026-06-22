import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  commissionSplitPercent: z.number().min(0).max(100).optional(),
  fullTrackingLink: z.string().url("Must be a valid URL").optional(),
}).refine((d) => d.commissionSplitPercent !== undefined || d.fullTrackingLink !== undefined, {
  message: "Provide commissionSplitPercent or fullTrackingLink",
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const link = await prisma.affiliateLink.findUnique({ where: { id } })
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 })

  const updateData: { commissionSplitPercent?: number; fullTrackingLink?: string } = {}
  if (parsed.data.commissionSplitPercent !== undefined) {
    updateData.commissionSplitPercent = parsed.data.commissionSplitPercent
  }
  if (parsed.data.fullTrackingLink !== undefined) {
    updateData.fullTrackingLink = parsed.data.fullTrackingLink
  }

  const updated = await prisma.affiliateLink.update({
    where: { id },
    data: updateData,
    include: { offer: { select: { name: true, brand: true } } },
  })

  return NextResponse.json({
    id: updated.id,
    fullTrackingLink: updated.fullTrackingLink,
    commissionSplitPercent: Number(updated.commissionSplitPercent),
    offer: updated.offer,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const link = await prisma.affiliateLink.findUnique({ where: { id } })
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 })

  await prisma.affiliateLink.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
