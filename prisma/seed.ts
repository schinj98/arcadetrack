/**
 * Seed: 1 admin, 2 approved affiliates, 3 offers, 15 realistic conversions.
 * Run: npx prisma db seed
 */
import { PrismaClient, ConversionStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding ArcadeTrack database…\n")

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@arcadetrack.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@arcadetrack.com",
      hashedPassword: adminPw,
      role: "ADMIN",
      status: "APPROVED",
    },
  })
  console.log("✓  Admin:", admin.email)

  // ── Affiliates ────────────────────────────────────────────────────────────
  const aff1Pw = await bcrypt.hash("partner123!", 12)
  const aff1 = await prisma.user.upsert({
    where: { email: "jordan@example.com" },
    update: {},
    create: {
      name: "Jordan Mitchell",
      email: "jordan@example.com",
      hashedPassword: aff1Pw,
      role: "AFFILIATE",
      status: "APPROVED",
      subIdCode: "ATJRD1X",
      trafficSource: "paid_ads",
      company: "Mitchell Media LLC",
      payoutMethod: "PayPal",
    },
  })
  console.log("✓  Affiliate 1:", aff1.email, "— SubID:", aff1.subIdCode)

  const aff2Pw = await bcrypt.hash("partner456!", 12)
  const aff2 = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya@example.com",
      hashedPassword: aff2Pw,
      role: "AFFILIATE",
      status: "APPROVED",
      subIdCode: "ATPRS2Y",
      trafficSource: "seo_content",
      company: null,
      payoutMethod: "Bank Transfer",
    },
  })
  console.log("✓  Affiliate 2:", aff2.email, "— SubID:", aff2.subIdCode)

  // Pending affiliate (no subIdCode, awaiting review)
  const aff3Pw = await bcrypt.hash("partner789!", 12)
  const aff3 = await prisma.user.upsert({
    where: { email: "marcus@example.com" },
    update: {},
    create: {
      name: "Marcus T.",
      email: "marcus@example.com",
      hashedPassword: aff3Pw,
      role: "AFFILIATE",
      status: "PENDING",
      trafficSource: "youtube",
      company: null,
    },
  })
  console.log("✓  Affiliate 3 (pending):", aff3.email)

  // ── Offers ────────────────────────────────────────────────────────────────
  const offer1 = await prisma.offer.upsert({
    where: { id: "seed-offer-001" },
    update: {},
    create: {
      id: "seed-offer-001",
      name: "Premium Credit Card Signup",
      brand: "FirstBank",
      baseTrackingLink: "https://track.impact.com/c/firstbank-cc?irpid=1001",
      payoutAmount: 120.00,
      commissionSplitPercent: 65,
      vertical: "Finance",
      status: "ACTIVE",
      description: "Earn $120 gross per approved credit card application. Sub-affiliates receive 65% of that.",
    },
  })
  console.log("✓  Offer 1:", offer1.name)

  const offer2 = await prisma.offer.upsert({
    where: { id: "seed-offer-002" },
    update: {},
    create: {
      id: "seed-offer-002",
      name: "Online Fashion Boutique",
      brand: "Veldora",
      baseTrackingLink: "https://track.impact.com/c/veldora-fashion?irpid=1002",
      payoutAmount: 45.00,
      commissionSplitPercent: 70,
      vertical: "Fashion",
      status: "ACTIVE",
      description: "Commission on first purchase. High-converting fashion brand targeting 25-40 demographic.",
    },
  })
  console.log("✓  Offer 2:", offer2.name)

  const offer3 = await prisma.offer.upsert({
    where: { id: "seed-offer-003" },
    update: {},
    create: {
      id: "seed-offer-003",
      name: "SaaS Project Management Tool",
      brand: "FlowDesk",
      baseTrackingLink: "https://track.impact.com/c/flowdesk-saas?irpid=1003",
      payoutAmount: 85.00,
      commissionSplitPercent: 60,
      vertical: "SaaS",
      status: "ACTIVE",
      description: "Pay-per-trial. Users who activate a free trial and use for 14+ days trigger payout.",
    },
  })
  console.log("✓  Offer 3:", offer3.name)

  // ── Affiliate Links ───────────────────────────────────────────────────────
  await prisma.affiliateLink.upsert({
    where: { userId_offerId: { userId: aff1.id, offerId: offer1.id } },
    update: {},
    create: {
      userId: aff1.id,
      offerId: offer1.id,
      fullTrackingLink: `${offer1.baseTrackingLink}&PubSubid1=${aff1.subIdCode}`,
    },
  })
  await prisma.affiliateLink.upsert({
    where: { userId_offerId: { userId: aff1.id, offerId: offer2.id } },
    update: {},
    create: {
      userId: aff1.id,
      offerId: offer2.id,
      fullTrackingLink: `${offer2.baseTrackingLink}&PubSubid1=${aff1.subIdCode}`,
    },
  })
  await prisma.affiliateLink.upsert({
    where: { userId_offerId: { userId: aff2.id, offerId: offer1.id } },
    update: {},
    create: {
      userId: aff2.id,
      offerId: offer1.id,
      fullTrackingLink: `${offer1.baseTrackingLink}&PubSubid1=${aff2.subIdCode}`,
    },
  })
  await prisma.affiliateLink.upsert({
    where: { userId_offerId: { userId: aff2.id, offerId: offer3.id } },
    update: {},
    create: {
      userId: aff2.id,
      offerId: offer3.id,
      fullTrackingLink: `${offer3.baseTrackingLink}&PubSubid1=${aff2.subIdCode}`,
    },
  })
  console.log("✓  Affiliate links created")

  // ── Conversions ───────────────────────────────────────────────────────────
  // prettier-ignore
  const conversionSeed: Array<{
    impactActionId: string
    userId: string
    offerId: string
    subId1: string
    status: ConversionStatus
    daysAgoAction: number
    saleAmount: number
    grossCommission: number
    splitPct: number
    campaignName: string
  }> = [
    // Jordan — offer1 (Finance, 65% split) — mix of all statuses
    { impactActionId: "IMP-J001", userId: aff1.id, offerId: offer1.id, subId1: aff1.subIdCode!, status: "CLEARED",  daysAgoAction: 75, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup" },
    { impactActionId: "IMP-J002", userId: aff1.id, offerId: offer1.id, subId1: aff1.subIdCode!, status: "CLEARED",  daysAgoAction: 60, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup" },
    { impactActionId: "IMP-J003", userId: aff1.id, offerId: offer1.id, subId1: aff1.subIdCode!, status: "CLEARED",  daysAgoAction: 50, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup" },
    { impactActionId: "IMP-J004", userId: aff1.id, offerId: offer1.id, subId1: aff1.subIdCode!, status: "REVERSED", daysAgoAction: 45, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup" },
    { impactActionId: "IMP-J005", userId: aff1.id, offerId: offer2.id, subId1: aff1.subIdCode!, status: "CLEARED",  daysAgoAction: 40, saleAmount: 189.99, grossCommission: 45.00,  splitPct: 70, campaignName: "Online Fashion Boutique"    },
    { impactActionId: "IMP-J006", userId: aff1.id, offerId: offer2.id, subId1: aff1.subIdCode!, status: "LOCKED",   daysAgoAction: 20, saleAmount: 212.50, grossCommission: 45.00,  splitPct: 70, campaignName: "Online Fashion Boutique"    },
    { impactActionId: "IMP-J007", userId: aff1.id, offerId: offer2.id, subId1: aff1.subIdCode!, status: "LOCKED",   daysAgoAction: 15, saleAmount: 97.00,  grossCommission: 45.00,  splitPct: 70, campaignName: "Online Fashion Boutique"    },
    { impactActionId: "IMP-J008", userId: aff1.id, offerId: offer1.id, subId1: aff1.subIdCode!, status: "PENDING",  daysAgoAction: 5,  saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup" },
    { impactActionId: "IMP-J009", userId: aff1.id, offerId: offer2.id, subId1: aff1.subIdCode!, status: "PENDING",  daysAgoAction: 3,  saleAmount: 145.00, grossCommission: 45.00,  splitPct: 70, campaignName: "Online Fashion Boutique"    },

    // Priya — offer1 + offer3 (Finance & SaaS)
    { impactActionId: "IMP-P001", userId: aff2.id, offerId: offer1.id, subId1: aff2.subIdCode!, status: "CLEARED",  daysAgoAction: 80, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup"     },
    { impactActionId: "IMP-P002", userId: aff2.id, offerId: offer3.id, subId1: aff2.subIdCode!, status: "CLEARED",  daysAgoAction: 65, saleAmount: 0,      grossCommission: 85.00,  splitPct: 60, campaignName: "SaaS Project Management Tool"  },
    { impactActionId: "IMP-P003", userId: aff2.id, offerId: offer3.id, subId1: aff2.subIdCode!, status: "CLEARED",  daysAgoAction: 55, saleAmount: 0,      grossCommission: 85.00,  splitPct: 60, campaignName: "SaaS Project Management Tool"  },
    { impactActionId: "IMP-P004", userId: aff2.id, offerId: offer3.id, subId1: aff2.subIdCode!, status: "LOCKED",   daysAgoAction: 25, saleAmount: 0,      grossCommission: 85.00,  splitPct: 60, campaignName: "SaaS Project Management Tool"  },
    { impactActionId: "IMP-P005", userId: aff2.id, offerId: offer1.id, subId1: aff2.subIdCode!, status: "LOCKED",   daysAgoAction: 18, saleAmount: 0,      grossCommission: 120.00, splitPct: 65, campaignName: "Premium Credit Card Signup"     },
    { impactActionId: "IMP-P006", userId: aff2.id, offerId: offer3.id, subId1: aff2.subIdCode!, status: "PENDING",  daysAgoAction: 4,  saleAmount: 0,      grossCommission: 85.00,  splitPct: 60, campaignName: "SaaS Project Management Tool"  },
  ]

  for (const c of conversionSeed) {
    const actionDate = daysAgo(c.daysAgoAction)
    const affiliateEarning = c.grossCommission * (c.splitPct / 100)

    // Locking date: ~7 days after action
    const lockingDate =
      c.status !== "PENDING"
        ? new Date(actionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null

    // Clearing date: ~37 days after action (30-day lock window)
    const clearingDate =
      c.status === "CLEARED" || c.status === "REVERSED"
        ? new Date(actionDate.getTime() + 37 * 24 * 60 * 60 * 1000)
        : c.status === "LOCKED"
          ? new Date(Date.now() + randomBetween(5, 20) * 24 * 60 * 60 * 1000) // future
          : null

    await prisma.conversion.upsert({
      where: { impactActionId: c.impactActionId },
      update: {},
      create: {
        impactActionId: c.impactActionId,
        userId: c.userId,
        offerId: c.offerId,
        subId1: c.subId1,
        status: c.status,
        actionDate,
        saleAmount: c.saleAmount,
        grossCommission: c.grossCommission,
        affiliateEarning,
        lockingDate,
        clearingDate,
        campaignName: c.campaignName,
      },
    })
  }
  console.log("✓  15 conversions seeded (4 statuses across 2 affiliates)")

  // ── Payout — Jordan has received one payout ───────────────────────────────
  const existingPayout = await prisma.payout.findFirst({
    where: { userId: aff1.id },
  })
  if (!existingPayout) {
    await prisma.payout.create({
      data: {
        userId: aff1.id,
        amount: 234.00,  // 3 cleared conversions @ 65%: 78+78+78 = 234
        status: "PAID",
        periodStart: daysAgo(90),
        periodEnd: daysAgo(45),
        paidAt: daysAgo(38),
        notes: "PayPal payment — Nov cycle",
      },
    })
    console.log("✓  Payout recorded for Jordan")
  }

  // ── Sync log — simulate a previous successful sync ────────────────────────
  const existingLog = await prisma.syncLog.findFirst()
  if (!existingLog) {
    await prisma.syncLog.create({
      data: {
        status: "SUCCESS",
        recordsPulled: 22,
        recordsNew: 15,
        recordsUpdated: 7,
        durationMs: 1843,
        runAt: daysAgo(1),
      },
    })
    console.log("✓  Sample sync log created")
  }

  console.log("\n✅  Seed complete!\n")
  console.log("  Admin:       admin@arcadetrack.com / admin123!")
  console.log("  Affiliate 1: jordan@example.com   / partner123!")
  console.log("  Affiliate 2: priya@example.com    / partner456!")
  console.log("  Pending:     marcus@example.com   / partner789!\n")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
