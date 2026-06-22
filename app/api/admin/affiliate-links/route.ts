import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  userId: z.string(),
  campaignId: z.string(),
  campaignName: z.string(),
  advertiserName: z.string(),
  trackingLink: z.string().min(1, "Tracking link is required"),
  commissionSplitPercent: z.number().min(0).max(100),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { userId, campaignId, campaignName, advertiserName, trackingLink, commissionSplitPercent } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== "AFFILIATE" || user.status !== "APPROVED" || !user.subIdCode) {
    return NextResponse.json({ error: "User must be an approved affiliate with a SubID" }, { status: 400 })
  }

  // Prefer campaignId match, fall back to brand name
  let offer = campaignId
    ? await prisma.offer.findFirst({ where: { impactCampaignId: campaignId } })
    : null

  if (!offer) {
    offer = await prisma.offer.findFirst({
      where: { brand: { equals: advertiserName, mode: "insensitive" }, impactCampaignId: null },
    })
  }

  if (!offer) {
    offer = await prisma.offer.create({
      data: {
        name: campaignName,
        brand: advertiserName,
        baseTrackingLink: trackingLink,
        payoutAmount: 0,
        commissionSplitPercent: 0,
        status: "ACTIVE",
        impactCampaignId: campaignId || null,
        description: `Impact Campaign ID: ${campaignId}`,
      },
    })
  } else {
    await prisma.offer.update({
      where: { id: offer.id },
      data: { baseTrackingLink: trackingLink, impactCampaignId: campaignId || offer.impactCampaignId },
    })
  }

  const sep = trackingLink.includes("?") ? "&" : "?"
  const fullTrackingLink = `${trackingLink}${sep}PubSubid1=${user.subIdCode}`

  const link = await prisma.affiliateLink.upsert({
    where: { userId_offerId: { userId, offerId: offer.id } },
    create: { userId, offerId: offer.id, fullTrackingLink, commissionSplitPercent },
    update: { fullTrackingLink, commissionSplitPercent },
    include: { offer: { select: { name: true, brand: true } } },
  })

  return NextResponse.json({
    id: link.id,
    offerId: link.offerId,
    fullTrackingLink: link.fullTrackingLink,
    commissionSplitPercent: Number(link.commissionSplitPercent),
    offer: link.offer,
  }, { status: 201 })
}
