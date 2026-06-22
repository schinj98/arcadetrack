/**
 * Impact.com publisher API client.
 *
 * Uses Basic Auth: IMPACT_ACCOUNT_SID:IMPACT_AUTH_TOKEN
 * Endpoint: GET /Mediapartners/{AccountSid}/Actions
 *
 * Date params require ISO 8601 with UTC suffix: "YYYY-MM-DDT00:00:00Z"
 * Impact enforces a maximum 45-day window per request; this client
 * automatically splits wider ranges into sequential 45-day chunks.
 *
 * All money fields come back as strings ("45.00") — callers must parseFloat().
 */

const BASE_URL = "https://api.impact.com"
const PAGE_SIZE = 1000
const MAX_WINDOW_DAYS = 45

export interface ImpactAction {
  Id: string
  SubId1: string
  EventDate: string            // action event timestamp (ISO 8601 with offset)
  State: string                // "PENDING" | "APPROVED" | "REVERSED"
  Amount: string               // sale/order amount (USD string)
  Payout: string               // gross publisher commission (USD string)
  LockingDate?: string | null  // date action locked for payment
  ClearedDate?: string | null  // present = payment has cleared
  CampaignId?: string | null
  CampaignName?: string | null // advertiser / campaign name
  ReferringDomain?: string | null
}

interface ActionsPage {
  "@page": number | string
  "@pagesize": number | string
  "@total": number | string
  Actions?: ImpactAction[]
}

function getAuth(): string {
  const sid = process.env.IMPACT_ACCOUNT_SID
  const token = process.env.IMPACT_AUTH_TOKEN
  if (!sid || !token) throw new Error("IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN are not set")
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64")
}

function toImpactDate(d: Date): string {
  // Impact requires full ISO 8601 with UTC marker, e.g. "2024-06-01T00:00:00Z"
  return d.toISOString().replace(/\.\d{3}Z$/, "Z").split("T")[0] + "T00:00:00Z"
}

function toImpactDateEnd(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z").split("T")[0] + "T23:59:59Z"
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, ms))
}

async function fetchPage(
  sid: string,
  auth: string,
  startDate: Date,
  endDate: Date,
  page: number
): Promise<ActionsPage> {
  const params = new URLSearchParams({
    ActionDateStart: toImpactDate(startDate),
    ActionDateEnd: toImpactDateEnd(endDate),
    PageSize: String(PAGE_SIZE),
    Page: String(page),
  })

  const url = `${BASE_URL}/Mediapartners/${sid}/Actions?${params}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: auth, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    })

    if (res.status === 429) {
      if (attempt === 3) throw new Error("Impact API rate limit exceeded (3 retries)")
      await sleep(2_000 * attempt)
      continue
    }

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Impact API ${res.status}: ${body.slice(0, 400)}`)
    }

    return res.json() as Promise<ActionsPage>
  }

  throw new Error("Impact API: unexpected retry exhaustion")
}

async function fetchWindow(
  sid: string,
  auth: string,
  startDate: Date,
  endDate: Date
): Promise<ImpactAction[]> {
  const all: ImpactAction[] = []
  let page = 1
  let total = Infinity

  while (all.length < total) {
    const data = await fetchPage(sid, auth, startDate, endDate, page)
    const actions = data.Actions ?? []
    total = Number(data["@total"] ?? 0)

    all.push(...actions.filter((a) => a.SubId1?.trim()))

    if (all.length >= total || actions.length === 0) break
    page++
    await sleep(300)
  }

  return all
}

/**
 * Fetch all conversion actions in [startDate, endDate], paging automatically.
 * Splits into 45-day chunks if the range exceeds Impact's per-request limit.
 * Filters to actions that have a non-empty SubId1 (our sub-affiliates).
 */
export async function getActionsBySubId(
  startDate: Date,
  endDate: Date
): Promise<ImpactAction[]> {
  const sid = process.env.IMPACT_ACCOUNT_SID!
  const auth = getAuth()
  const all: ImpactAction[] = []

  const MS_PER_DAY = 86_400_000
  let chunkStart = new Date(startDate)

  while (chunkStart < endDate) {
    const chunkEnd = new Date(
      Math.min(
        chunkStart.getTime() + MAX_WINDOW_DAYS * MS_PER_DAY - 1,
        endDate.getTime()
      )
    )

    const chunk = await fetchWindow(sid, auth, chunkStart, chunkEnd)
    all.push(...chunk)

    chunkStart = new Date(chunkEnd.getTime() + 1)
    if (chunkStart < endDate) await sleep(300) // pacing between chunks
  }

  return all
}

export interface ImpactCampaign {
  campaignId: string
  campaignName: string
  advertiserName: string
  advertiserUrl: string
  description: string
  trackingLink: string   // empty string if not available
  logoPath: string       // relative URI to campaign logo
}

/** Fetch all campaigns this publisher is enrolled in. */
export async function getCampaigns(): Promise<ImpactCampaign[]> {
  const sid = process.env.IMPACT_ACCOUNT_SID
  const token = process.env.IMPACT_AUTH_TOKEN
  if (!sid || !token) throw new Error("IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN are not set")
  const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64")

  const res = await fetch(`${BASE_URL}/Mediapartners/${sid}/Campaigns?PageSize=100`, {
    headers: { Authorization: auth, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Impact Campaigns API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json() as { Campaigns?: Record<string, string>[] }
  return (data.Campaigns ?? []).map((c) => ({
    campaignId: c.CampaignId ?? "",
    campaignName: c.CampaignName ?? "",
    advertiserName: c.AdvertiserName ?? "",
    advertiserUrl: c.AdvertiserUrl ?? "",
    description: c.CampaignDescription ?? "",
    trackingLink: c.TrackingLink ?? "",
    logoPath: c.CampaignLogoUri ?? "",
  }))
}

/**
 * Summarize performance metrics for a specific subId1 over a date range.
 * Returns totals by status — useful for lightweight dashboard widgets.
 */
export function getPerformanceBySubId(
  actions: ImpactAction[],
  subId1: string
): {
  totalActions: number
  totalCommission: number
  byStatus: Record<string, { count: number; commission: number }>
} {
  const mine = actions.filter((a) => a.SubId1 === subId1)
  const byStatus: Record<string, { count: number; commission: number }> = {}

  for (const a of mine) {
    const s = a.State ?? "Unknown"
    if (!byStatus[s]) byStatus[s] = { count: 0, commission: 0 }
    byStatus[s].count++
    byStatus[s].commission += parseFloat(a.Payout || "0")
  }

  return {
    totalActions: mine.length,
    totalCommission: mine.reduce((sum, a) => sum + parseFloat(a.Payout || "0"), 0),
    byStatus,
  }
}
