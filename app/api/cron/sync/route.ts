import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { runSync } from "@/lib/sync"

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? ""
  const secret = process.env.CRON_SECRET

  if (!secret || !safeCompare(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const log = await runSync()
  return NextResponse.json({ ...log, runAt: log.runAt.toISOString() })
}
