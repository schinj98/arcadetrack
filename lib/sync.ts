import { prisma } from "@/lib/prisma"
import { ConversionStatus } from "@prisma/client"
import { getActionsBySubId } from "@/lib/impact"

/**
 * Derive our 4-state ConversionStatus from Impact's State field + date fields.
 * Impact State values: "APPROVED" | "PENDING" | "REVERSED"
 * ClearedDate present = payment has cleared regardless of State.
 */
function mapStatus(action: { State: string; ClearedDate?: string | null }): ConversionStatus {
  const state = (action.State ?? "").toUpperCase().trim()
  if (state === "REVERSED") return "REVERSED"
  if (action.ClearedDate) return "CLEARED"
  if (state === "APPROVED") return "LOCKED"
  return "PENDING"
}

/**
 * Match an Impact action to one of our Offer records.
 * Tries campaignId first (exact), then brand name substring match.
 */
function matchOffer(
  campaignId: string | null | undefined,
  campaignName: string | null | undefined,
  offerByCampaignId: Map<string, { id: string }>,
  offerByBrand: Map<string, { id: string }>
): { id: string } | null {
  if (campaignId && offerByCampaignId.has(campaignId)) return offerByCampaignId.get(campaignId)!
  if (!campaignName) return null
  const lower = campaignName.toLowerCase()
  if (offerByBrand.has(lower)) return offerByBrand.get(lower)!
  for (const [brand, offer] of offerByBrand) {
    if (lower.includes(brand) || brand.includes(lower)) return offer
  }
  return null
}

export async function runSync() {
  const startMs = Date.now()

  // Guard: credentials required
  if (!process.env.IMPACT_ACCOUNT_SID || !process.env.IMPACT_AUTH_TOKEN) {
    return prisma.syncLog.create({
      data: {
        status: "FAILED",
        recordsPulled: 0,
        recordsNew: 0,
        recordsUpdated: 0,
        errorMessage: "IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN are not configured.",
        durationMs: Date.now() - startMs,
      },
    })
  }

  try {
    // ── Determine date window ───────────────────────────────────────────────
    const lastSuccess = await prisma.syncLog.findFirst({
      where: { status: { in: ["SUCCESS", "PARTIAL"] } },
      orderBy: { runAt: "desc" },
    })

    const endDate = new Date()
    const startDate = lastSuccess
      ? new Date(lastSuccess.runAt.getTime() - 7 * 24 * 60 * 60 * 1000) // 7-day overlap
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)                  // first sync: 90 days back

    // ── Fetch from Impact ───────────────────────────────────────────────────
    const actions = await getActionsBySubId(startDate, endDate)

    // ── Load lookup maps ────────────────────────────────────────────────────
    const [dbUsers, dbOffers, dbLinks] = await Promise.all([
      prisma.user.findMany({
        where: { role: "AFFILIATE", status: "APPROVED", subIdCode: { not: null } },
        select: { id: true, subIdCode: true },
      }),
      prisma.offer.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, brand: true, impactCampaignId: true },
      }),
      prisma.affiliateLink.findMany({
        select: { userId: true, offerId: true, commissionSplitPercent: true },
      }),
    ])

    const userBySubId = new Map(dbUsers.map((u) => [u.subIdCode!, u]))
    const offerByCampaignId = new Map(
      dbOffers.filter((o) => o.impactCampaignId).map((o) => [o.impactCampaignId!, { id: o.id }])
    )
    const offerByBrand = new Map(
      dbOffers.map((o) => [o.brand.toLowerCase(), { id: o.id }])
    )
    // Per-affiliate per-offer commission: "userId:offerId" → %
    const linkCommission = new Map(
      dbLinks.map((l) => [`${l.userId}:${l.offerId}`, Number(l.commissionSplitPercent)])
    )

    // ── Filter to actions we own (SubId1 matches a known sub-affiliate) ─────
    const relevant = actions.filter((a) => userBySubId.has(a.SubId1))

    // ── Determine which action IDs already exist (for new vs updated tracking)
    const existingSet = new Set(
      (
        await prisma.conversion.findMany({
          where: { impactActionId: { in: relevant.map((a) => a.Id) } },
          select: { impactActionId: true },
        })
      ).map((c) => c.impactActionId)
    )

    // ── Process each action ─────────────────────────────────────────────────
    let recordsNew = 0
    let recordsUpdated = 0
    let recordsFailed = 0

    for (const action of relevant) {
      const user = userBySubId.get(action.SubId1)!
      const grossCommission = parseFloat(action.Payout || "0")
      const offer = matchOffer(action.CampaignId, action.CampaignName, offerByCampaignId, offerByBrand)

      // Use the affiliate's specific commission rate from their AffiliateLink
      // Falls back to 0 if no link exists (admin hasn't granted access to this brand)
      const splitPct = offer ? (linkCommission.get(`${user.id}:${offer.id}`) ?? 0) : 0
      const affiliateEarning = grossCommission * (splitPct / 100)

      const sharedPayload = {
        userId: user.id,
        offerId: offer?.id ?? null,
        subId1: action.SubId1,
        status: mapStatus(action),
        actionDate: new Date(action.EventDate),
        saleAmount: parseFloat(action.Amount || "0"),
        grossCommission,
        affiliateEarning,
        lockingDate: action.LockingDate ? new Date(action.LockingDate) : null,
        clearingDate: action.ClearedDate ? new Date(action.ClearedDate) : null,
        campaignName: action.CampaignName ?? null,
        syncedAt: new Date(),
      }

      try {
        if (existingSet.has(action.Id)) {
          // Preserve removedByAdmin and adminNote — do not overwrite admin actions
          await prisma.conversion.update({
            where: { impactActionId: action.Id },
            data: sharedPayload,
          })
          recordsUpdated++
        } else {
          await prisma.conversion.create({
            data: { impactActionId: action.Id, ...sharedPayload },
          })
          recordsNew++
        }
      } catch {
        recordsFailed++
      }
    }

    // ── Determine final sync status ─────────────────────────────────────────
    const syncStatus =
      recordsFailed > 0 && recordsFailed === relevant.length
        ? "FAILED"
        : recordsFailed > 0
          ? "PARTIAL"
          : "SUCCESS"

    return prisma.syncLog.create({
      data: {
        status: syncStatus,
        recordsPulled: actions.length,
        recordsNew,
        recordsUpdated,
        errorMessage:
          recordsFailed > 0
            ? `${recordsFailed} record(s) failed to upsert`
            : null,
        durationMs: Date.now() - startMs,
      },
    })
  } catch (err) {
    return prisma.syncLog.create({
      data: {
        status: "FAILED",
        recordsPulled: 0,
        recordsNew: 0,
        recordsUpdated: 0,
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startMs,
      },
    })
  }
}
