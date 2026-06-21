/**
 * Impact.com publisher API client.
 *
 * Uses Basic Auth: IMPACT_ACCOUNT_SID:IMPACT_AUTH_TOKEN
 * Endpoint: GET /Publishers/{AccountSid}/Actions
 *
 * All money fields come back as strings ("45.00") — callers must parseFloat().
 */

const BASE_URL = "https://api.impact.com"
const PAGE_SIZE = 1000

export interface ImpactAction {
  Id: string
  SubId1: string
  ActionDate: string           // ISO datetime string
  Status: string               // "Pending" | "Approved" | "Locked" | "Cleared" | "Reversed" | ...
  SaleAmount: string
  PublisherCommission: string  // Gross commission paid to us (the publisher)
  LockedDate?: string | null
  ClearedDate?: string | null  // Impact field: "ScheduledClearingDate" or "ClearedDate"
  CampaignId?: string | null
  CampaignName?: string | null
  AdvertiserName?: string | null
}

interface ActionsPage {
  "@page": number
  "@pagesize": number
  "@total": number
  Actions?: ImpactAction[]
}

function getAuth(): string {
  const sid = process.env.IMPACT_ACCOUNT_SID
  const token = process.env.IMPACT_AUTH_TOKEN
  if (!sid || !token) throw new Error("IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN are not set")
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64")
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
    "ActionDate[gte]": startDate.toISOString().split("T")[0],
    "ActionDate[lte]": endDate.toISOString().split("T")[0],
    PageSize: String(PAGE_SIZE),
    Page: String(page),
  })

  const url = `${BASE_URL}/Publishers/${sid}/Actions?${params}`

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

/**
 * Fetch all conversion actions in [startDate, endDate], paging automatically.
 * Filters to actions that have a non-empty SubId1 (our sub-affiliates).
 */
export async function getActionsBySubId(
  startDate: Date,
  endDate: Date
): Promise<ImpactAction[]> {
  const sid = process.env.IMPACT_ACCOUNT_SID!
  const auth = getAuth()
  const all: ImpactAction[] = []
  let page = 1
  let total = Infinity

  while (all.length < total) {
    const data = await fetchPage(sid, auth, startDate, endDate, page)
    const actions = data.Actions ?? []
    total = data["@total"] ?? 0

    // Only keep actions with a SubId1 value — those are from our sub-affiliates
    all.push(...actions.filter((a) => a.SubId1?.trim()))

    if (all.length >= total || actions.length === 0) break
    page++
    await sleep(300) // polite pacing between pages
  }

  return all
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
    const s = a.Status ?? "Unknown"
    if (!byStatus[s]) byStatus[s] = { count: 0, commission: 0 }
    byStatus[s].count++
    byStatus[s].commission += parseFloat(a.PublisherCommission || "0")
  }

  return {
    totalActions: mine.length,
    totalCommission: mine.reduce((sum, a) => sum + parseFloat(a.PublisherCommission || "0"), 0),
    byStatus,
  }
}
