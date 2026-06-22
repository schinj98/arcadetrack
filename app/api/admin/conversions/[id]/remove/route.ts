import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  removed: z.boolean(),
  note: z.string().max(500).optional(),
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

  const conversion = await prisma.conversion.findUnique({ where: { id } })
  if (!conversion) {
    return NextResponse.json({ error: "Conversion not found" }, { status: 404 })
  }

  const updated = await prisma.conversion.update({
    where: { id },
    data: {
      removedByAdmin: parsed.data.removed,
      adminNote: parsed.data.note ?? (parsed.data.removed ? conversion.adminNote : null),
    },
    select: { id: true, removedByAdmin: true, adminNote: true },
  })

  return NextResponse.json(updated)
}
