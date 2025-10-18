import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const createSchema = z.object({
  babyId: z.coerce.number().int().positive(),
  monthAge: z.coerce.number().int().min(0).max(240),
  heightCm: z.coerce.number().positive(),
  weightKg: z.coerce.number().positive(),
})

export async function GET() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items = await prisma.babyData.findMany({
    where: { baby: { userId: user.id } },
    orderBy: { monthAge: "desc" },
    select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  // Ensure the baby belongs to the current user
  const baby = await prisma.baby.findFirst({ where: { id: parsed.data.babyId, userId: user.id }, select: { id: true } })
  if (!baby) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const created = await prisma.babyData.create({
      data: {
        babyId: parsed.data.babyId,
        monthAge: parsed.data.monthAge,
        heightCm: parsed.data.heightCm,
        weightKg: parsed.data.weightKg,
      },
      select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Duplicate monthAge for this baby" }, { status: 409 })
    }
    return NextResponse.json({ error: "Create failed" }, { status: 400 })
  }
}
