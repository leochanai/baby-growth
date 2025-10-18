import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
})

export async function GET() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const babies = await prisma.baby.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, gender: true, birthDate: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(babies)
}

export async function POST(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const created = await prisma.baby.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      gender: parsed.data.gender as any,
      birthDate: new Date(parsed.data.birthDate),
    },
    select: { id: true, name: true, gender: true, birthDate: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(created, { status: 201 })
}

