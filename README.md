# ArcadeTrack Partners

Sub-affiliate management platform for an Impact.com publisher. Affiliates sign up, get unique tracking links, and see their conversions and earnings pulled automatically from the publisher's single Impact account — segmented by `PubSubid1`.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **NextAuth v4** — credentials + JWT, role-based
- **Prisma + PostgreSQL** (Supabase)
- **Tailwind CSS + shadcn/ui**
- **Recharts** — earnings chart
- **Zod + React Hook Form** — validation
- **bcryptjs** — password hashing
- **Vercel** — deploy + cron jobs

---

## Architecture

```
ONE Impact publisher account
        │
        │  GET /Publishers/{SID}/Actions
        ▼
   lib/impact.ts ──► lib/sync.ts ──► Postgres (conversions table)
                                           │
                           ┌──────────────┘
                           │  split by subId1 → user.subIdCode
                           ▼
              /dashboard  (affiliate view)
              /admin      (admin view)
```

### Sub-affiliate tracking

Impact doesn't know sub-affiliates exist. Every sub-affiliate gets a unique `subIdCode` (e.g. `ATJRD1X`) assigned on approval. Their tracking links append `?PubSubid1={subIdCode}` to each offer's Impact base URL. The sync job reads all actions, matches `SubId1` → `User.subIdCode`, and splits data per affiliate.

### Commission model

```
affiliateEarning = grossCommission × (commissionSplitPercent / 100)
```

Sub-affiliates only see their `affiliateEarning` — never the gross commission.

### Conversion lifecycle

```
PENDING → LOCKED → CLEARED → (paid out)
                └→ REVERSED
```

---

## Local setup

### 1. Clone and install

```bash
git clone <repo>
cd arcadetrack
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection (PgBouncer) |
| `DIRECT_URL` | Supabase direct connection (for migrations) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally |
| `NEXTAUTH_SECRET` | Random string — `openssl rand -base64 32` |
| `IMPACT_ACCOUNT_SID` | Impact publisher Account SID |
| `IMPACT_AUTH_TOKEN` | Impact publisher Auth Token |
| `CRON_SECRET` | Random string to protect the cron endpoint |

### 3. Database

```bash
# Run migrations
npx prisma migrate deploy

# Seed with demo data (admin + 2 affiliates + 3 offers + 15 conversions)
npx prisma db seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo accounts:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@arcadetrack.com` | `admin123!` |
| Affiliate | `jordan@example.com` | `partner123!` |
| Affiliate | `priya@example.com` | `partner456!` |
| Pending | `marcus@example.com` | `partner789!` |

---

## Pages

| Route | Who | Description |
|---|---|---|
| `/` | Public | Landing page with hero, how-it-works, FAQ |
| `/signup` | Public | Affiliate application form |
| `/login` | Public | Sign in |
| `/awaiting-approval` | Pending affiliates | Application status page |
| `/dashboard` | Approved affiliates | Earnings overview + chart |
| `/dashboard/links` | Approved affiliates | Tracking links per offer |
| `/dashboard/payouts` | Approved affiliates | Payout history + explainer |
| `/admin` | Admin | Platform overview |
| `/admin/approvals` | Admin | Approve / suspend affiliates |
| `/admin/partners` | Admin | All partners, sortable |
| `/admin/partners/[id]` | Admin | Partner drilldown |
| `/admin/offers` | Admin | Full CRUD for offers |
| `/admin/payouts` | Admin | Owed amounts + mark as paid |
| `/admin/sync` | Admin | Manual sync + log history |

---

## Impact API sync

### Credentials

Find your credentials in the Impact dashboard → **Settings → API**.

```
IMPACT_ACCOUNT_SID = your Account SID
IMPACT_AUTH_TOKEN  = your Auth Token
```

### How sync works

1. Determines the date window (last 90 days on first run; since last sync − 7 days overlap thereafter)
2. Calls `GET /Publishers/{SID}/Actions` with date range, paging at 1000 records
3. Filters to actions where `SubId1` matches a known `user.subIdCode`
4. Matches `AdvertiserName` → `Offer.brand` (case-insensitive) to resolve `offerId` and commission split
5. Upserts `Conversion` records — idempotent via `impactActionId @unique`
6. Writes a `SyncLog` entry with pulled/new/updated counts and duration

### Automatic sync

Runs every 3 hours via Vercel Cron (`vercel.json`). The cron endpoint is:

```
GET /api/cron/sync
Authorization: Bearer {CRON_SECRET}
```

### Manual sync

Admins can trigger a sync from `/admin/sync` or via:

```bash
curl -X POST https://your-domain.com/api/admin/sync \
  -H "Cookie: next-auth.session-token=..."
```

---

## Offer matching

When a new offer is added to Impact, create a matching record in `/admin/offers` with the **exact brand name** as it appears in Impact's `AdvertiserName` field. The sync uses case-insensitive substring matching:

- Impact `AdvertiserName: "Nike"` → matches `Offer.brand: "Nike"` ✓
- Impact `AdvertiserName: "Nike Inc."` → matches `Offer.brand: "Nike"` ✓ (contains match)

If no offer is matched, the conversion is recorded with `offerId = null` and `affiliateEarning = 0`. Create the offer record and re-sync to recalculate.

---

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in Vercel project settings. The cron job in `vercel.json` runs automatically on Pro and above plans.

**Important:** Use the **pooled** Supabase connection string for `DATABASE_URL` and the **direct** connection string for `DIRECT_URL` (required by Prisma for migrations).

---

## Project structure

```
arcadetrack/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── awaiting-approval/page.tsx
│   ├── dashboard/                  # Affiliate dashboard
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── links/page.tsx
│   │   └── payouts/page.tsx
│   ├── admin/                      # Admin panel
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── offers/page.tsx
│   │   ├── partners/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── payouts/page.tsx
│   │   └── sync/page.tsx
│   └── api/
│       ├── auth/
│       ├── admin/                  # Admin API routes
│       ├── affiliate/              # Affiliate API routes
│       └── cron/sync/route.ts     # Vercel cron endpoint
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── admin/                      # Admin sidebar
│   ├── dashboard/                  # Affiliate sidebar, chart, copy button
│   └── landing/                    # FAQ accordion
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── impact.ts                   # Impact API client
│   ├── prisma.ts                   # Prisma singleton
│   ├── sync.ts                     # Sync orchestration
│   └── utils.ts                    # cn, formatCurrency, formatDate, generateSubIdCode
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                   # Route protection
├── vercel.json                     # Cron schedule
└── .env.example
```
