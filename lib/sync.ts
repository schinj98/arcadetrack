import { prisma } from "@/lib/prisma"
import { ConversionStatus } from "@prisma/client"
import { getActionsBySubId } from "@/lib/impact"

/**
 * Map Impact's status strings to our ConversionStatus enum.
 * Impact statuses: Pending, Approved, Locked, Cleared, Reversed, Rejected, Voided, Cancelled
 */
function mapStatus(impactStatus: string): ConversionStatus {
  const s = impactStatus.toLowerCase().trim()
  if (s === "cleared") return "CLEARED"
  if (s === "locked" || s === "approved") return "LOCKED"
  if (s === "reversed" || s === "rejected" || s === "voided" || s === "cancelled") return "REVERSED"
  return "PENDING"
}

/**
 * Best-effort match of an Impact advertiser name to one of our Offer records.
 * Tries exact brand match first, then contains match.
 */
function matchOffer(
  advertiserName: string | null | undefined,
  campaignName: string | null | undefined,
  offerByBrand: Map<string, { id: string; commissionSplitPercent: number }>
): { id: string; commissionSplitPercent: number } | null {
  const candidates = [advertiserName, campaignName].filter(Boolean) as string[]

  for (const name of candidates) {
    const lower = name.toLowerCase()
    // Exact match
    if (offerByBrand.has(lower)) return offerByBrand.get(lower)!
    // Contains match — find first offer whose brand is a substring of the name or vice-versa
    for (const [brand, offer] of offerByBrand) {
      if (lower.includes(brand) || brand.includes(lower)) return offer
    }
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
    const [dbUsers, dbOffers] = await Promise.all([
      prisma.user.findMany({
        where: { role: "AFFILIATE", status: "APPROVED", subIdCode: { not: null } },
        select: { id: true, subIdCode: true },
      }),
      prisma.offer.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, brand: true, commissionSplitPercent: true },
      }),
    ])

    const userBySubId = new Map(dbUsers.map((u) => [u.subIdCode!, u]))
    const offerByBrand = new Map(
      dbOffers.map((o) => [
        o.brand.toLowerCase(),
        { id: o.id, commissionSplitPercent: Number(o.commissionSplitPercent) },
      ])
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
      const grossCommission = parseFloat(action.PublisherCommission || "0")
      const offer = matchOffer(action.AdvertiserName, action.CampaignName, offerByBrand)

      // If no offer matched, affiliate earning is 0 until admin creates the matching offer
      const splitPct = offer ? offer.commissionSplitPercent : 0
      const affiliateEarning = grossCommission * (splitPct / 100)

      const payload = {
        userId: user.id,
        offerId: offer?.id ?? null,
        subId1: action.SubId1,
        status: mapStatus(action.Status),
        actionDate: new Date(action.ActionDate),
        saleAmount: parseFloat(action.SaleAmount || "0"),
        grossCommission,
        affiliateEarning,
        lockingDate: action.LockedDate ? new Date(action.LockedDate) : null,
        clearingDate: action.ClearedDate ? new Date(action.ClearedDate) : null,
        campaignName: action.CampaignName ?? action.AdvertiserName ?? null,
        syncedAt: new Date(),
      }

      try {
        if (existingSet.has(action.Id)) {
          await prisma.conversion.update({
            where: { impactActionId: action.Id },
            data: payload,
          })
          recordsUpdated++
        } else {
          await prisma.conversion.create({
            data: { impactActionId: action.Id, ...payload },
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
