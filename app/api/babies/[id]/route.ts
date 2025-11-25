import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z
    .string()
    .optional()
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), { message: "Invalid date" }),
  color: z.string().optional(),
})

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const payload = await _req.json().catch(() => null)
  const parsed = updateSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const data: any = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.gender !== undefined) data.gender = parsed.data.gender
  if (parsed.data.birthDate !== undefined) data.birthDate = new Date(parsed.data.birthDate)
  if (parsed.data.color !== undefined) data.color = parsed.data.color

  const ok = await prisma.baby.findFirst({ where: { id, userId: user.id }, select: { id: true } })
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.baby.update({
    where: { id },
    data,
    select: { id: true, name: true, gender: true, birthDate: true, color: true, createdAt: true, updatedAt: true },
  }).catch(() => null)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const del = await prisma.baby.deleteMany({ where: { id, userId: user.id } })
  if (del.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
