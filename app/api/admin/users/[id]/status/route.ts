import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateSubIdCode } from "@/lib/utils"

const schema = z.object({
  status: z.enum(["APPROVED", "SUSPENDED", "PENDING"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { status } = parsed.data

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Generate subIdCode on first approval
  let subIdCode = user.subIdCode
  if (status === "APPROVED" && !subIdCode) {
    // Ensure uniqueness
    let code: string
    do {
      code = generateSubIdCode()
    } while (await prisma.user.findUnique({ where: { subIdCode: code } }))
    subIdCode = code
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status, subIdCode },
    select: { id: true, name: true, email: true, status: true, subIdCode: true },
  })

  return NextResponse.json(updated)
}
