import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { runSync } from "@/lib/sync"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === "ADMIN" ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const logs = await prisma.syncLog.findMany({
    orderBy: { runAt: "desc" },
    take: 50,
  })

  return NextResponse.json(
    logs.map((l) => ({ ...l, runAt: l.runAt.toISOString() }))
  )
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const log = await runSync()
  return NextResponse.json({ ...log, runAt: log.runAt.toISOString() })
}
