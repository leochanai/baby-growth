import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const gender = url.searchParams.get("gender")

  const items = await prisma.whoData.findMany({
    where: gender && (gender === "male" || gender === "female") ? { gender } : undefined,
    orderBy: [{ gender: "asc" }, { monthAge: "asc" }],
    select: { id: true, gender: true, monthAge: true, heightMedianCm: true, weightMedianKg: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(items)
}
