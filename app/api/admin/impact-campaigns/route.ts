import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCampaigns } from "@/lib/impact"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const campaigns = await getCampaigns()
    return NextResponse.json(campaigns)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}
