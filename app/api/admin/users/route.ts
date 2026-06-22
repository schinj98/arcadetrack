import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  subIdCode: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9]+$/, "SubID must be uppercase letters and numbers only"),
  company: z.string().optional(),
  trafficSource: z.string().optional(),
  mediaProperties: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { name, email, password, subIdCode, company, trafficSource, mediaProperties } = parsed.data

  const emailConflict = await prisma.user.findUnique({ where: { email } })
  if (emailConflict) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const subIdConflict = await prisma.user.findUnique({ where: { subIdCode } })
  if (subIdConflict) {
    return NextResponse.json({ error: `SubID "${subIdCode}" is already taken` }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: "AFFILIATE",
      status: "APPROVED",
      subIdCode,
      company: company || null,
      trafficSource: trafficSource || null,
      mediaProperties: mediaProperties || null,
    },
    select: { id: true, name: true, email: true, status: true, subIdCode: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { role: "AFFILIATE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      trafficSource: true,
      status: true,
      subIdCode: true,
      createdAt: true,
      payoutMethod: true,
      _count: { select: { conversions: true } },
      conversions: {
        where: { status: { in: ["CLEARED", "LOCKED", "PENDING"] } },
        select: { affiliateEarning: true, status: true },
      },
    },
  })

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    company: u.company,
    trafficSource: u.trafficSource,
    status: u.status,
    subIdCode: u.subIdCode,
    payoutMethod: u.payoutMethod,
    createdAt: u.createdAt.toISOString(),
    totalConversions: u._count.conversions,
    totalEarnings: u.conversions.reduce((sum, c) => sum + Number(c.affiliateEarning), 0),
    clearedEarnings: u.conversions
      .filter((c) => c.status === "CLEARED")
      .reduce((sum, c) => sum + Number(c.affiliateEarning), 0),
  }))

  return NextResponse.json(serialized)
}
