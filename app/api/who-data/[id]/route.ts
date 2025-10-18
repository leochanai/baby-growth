import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const updateSchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  monthAge: z.coerce.number().int().min(0).max(240).optional(),
  heightMedianCm: z.coerce.number().positive().optional(),
  weightMedianKg: z.coerce.number().positive().optional(),
})

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(ctx.params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const payload = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  try {
    const updated = await prisma.whoData.update({
      where: { id },
      data: parsed.data,
      select: { id: true, gender: true, monthAge: true, heightMedianCm: true, weightMedianKg: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Duplicate monthAge for this gender" }, { status: 409 })
    return NextResponse.json({ error: "Update failed" }, { status: 400 })
  }
}
