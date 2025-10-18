import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const updateSchema = z.object({
  babyId: z.coerce.number().int().positive().optional(),
  monthAge: z.coerce.number().int().min(0).max(240).optional(),
  heightCm: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
})

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(ctx.params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const payload = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  // Check ownership via join
  const existing = await prisma.babyData.findFirst({ where: { id, baby: { userId: user.id } }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If babyId is provided, ensure the baby also belongs to user
  if (parsed.data.babyId !== undefined) {
    const ok = await prisma.baby.findFirst({ where: { id: parsed.data.babyId, userId: user.id }, select: { id: true } })
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const updated = await prisma.babyData.update({
      where: { id },
      data: {
        babyId: parsed.data.babyId,
        monthAge: parsed.data.monthAge,
        heightCm: parsed.data.heightCm,
        weightKg: parsed.data.weightKg,
      },
      select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Duplicate monthAge for this baby" }, { status: 409 })
    }
    return NextResponse.json({ error: "Update failed" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(ctx.params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const del = await prisma.babyData.deleteMany({ where: { id, baby: { userId: user.id } } })
  if (del.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
