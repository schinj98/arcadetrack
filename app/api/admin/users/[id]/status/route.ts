import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const campaignSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  advertiserName: z.string(),
  trackingLink: z.string(),
  commissionSplitPercent: z.number().min(0).max(100).default(0),
})

const schema = z.object({
  status: z.enum(["APPROVED", "SUSPENDED", "PENDING"]),
  subIdCode: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9]+$/, "SubID must be uppercase letters and numbers only")
    .optional(),
  campaigns: z.array(campaignSchema).optional(),
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

  const { status, subIdCode, campaigns } = parsed.data

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (status === "APPROVED") {
    const finalSubId = subIdCode ?? user.subIdCode
    if (!finalSubId) {
      return NextResponse.json({ error: "SubID is required when approving" }, { status: 400 })
    }

    // Uniqueness check — exclude this user's own existing code
    const conflict = await prisma.user.findFirst({
      where: { subIdCode: finalSubId, NOT: { id } },
    })
    if (conflict) {
      return NextResponse.json({ error: `SubID "${finalSubId}" is already taken` }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status, subIdCode: finalSubId },
      select: { id: true, name: true, email: true, status: true, subIdCode: true },
    })

    // Create Offers + AffiliateLinks for each selected campaign
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        if (!campaign.trackingLink) continue

        // Find or auto-create an Offer keyed by Impact campaign ID first, then brand
        let offer = campaign.campaignId
          ? await prisma.offer.findFirst({ where: { impactCampaignId: campaign.campaignId } })
          : null

        if (!offer) {
          offer = await prisma.offer.findFirst({
            where: { brand: { equals: campaign.advertiserName, mode: "insensitive" }, impactCampaignId: null },
          })
        }

        if (!offer) {
          offer = await prisma.offer.create({
            data: {
              name: campaign.campaignName,
              brand: campaign.advertiserName,
              baseTrackingLink: campaign.trackingLink,
              payoutAmount: 0,
              commissionSplitPercent: 0,
              status: "ACTIVE",
              impactCampaignId: campaign.campaignId || null,
              description: `Impact Campaign ID: ${campaign.campaignId}`,
            },
          })
        } else {
          // Update base link and campaignId in case they changed
          await prisma.offer.update({
            where: { id: offer.id },
            data: {
              baseTrackingLink: campaign.trackingLink,
              impactCampaignId: campaign.campaignId || offer.impactCampaignId,
            },
          })
        }

        const sep = campaign.trackingLink.includes("?") ? "&" : "?"
        const fullTrackingLink = `${campaign.trackingLink}${sep}PubSubid1=${finalSubId}`

        await prisma.affiliateLink.upsert({
          where: { userId_offerId: { userId: id, offerId: offer.id } },
          create: {
            userId: id,
            offerId: offer.id,
            fullTrackingLink,
            commissionSplitPercent: campaign.commissionSplitPercent,
          },
          update: {
            fullTrackingLink,
            commissionSplitPercent: campaign.commissionSplitPercent,
          },
        })
      }
    }

    return NextResponse.json(updated)
  }

  // SUSPENDED or PENDING — just update status, keep existing SubID
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, email: true, status: true, subIdCode: true },
  })

  return NextResponse.json(updated)
}
