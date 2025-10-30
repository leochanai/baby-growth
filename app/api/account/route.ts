import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
// no import of authOptions; getServerSession() works without options for App Router
import { z } from "zod"

export async function GET() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, familyName: true, email: true, image: true, theme: true, palette: true, language: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(user)
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(32).optional(),
  familyName: z.string().trim().min(1).max(50).optional(),
  // Accept absolute URLs or app-relative paths like "/avatars/.."; empty string means remove
  image: z
    .string()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === "" ||
        v.startsWith("/") ||
        /^https?:\/\//i.test(v),
      {
        message: "Invalid image path",
      }
    ),
  theme: z.enum(["light", "dark", "system"]).optional(),
  palette: z.enum([
    "theme-default",
    "theme-red",
    "theme-orange",
    "theme-green",
    "theme-blue",
    "theme-yellow",
    "theme-violet",
  ]).optional(),
  language: z.enum(["en", "zh-CN"]).optional(),
})

export async function PATCH(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const data: { name?: string; familyName?: string | null; image?: string | null; theme?: string | null; palette?: string | null; language?: string | null } = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.familyName !== undefined) data.familyName = parsed.data.familyName || null
  if (parsed.data.image !== undefined) data.image = parsed.data.image || null
  if (parsed.data.theme !== undefined) data.theme = parsed.data.theme || null
  if (parsed.data.palette !== undefined) data.palette = parsed.data.palette || null
  if (parsed.data.language !== undefined) data.language = parsed.data.language || null
  // If image is being removed, delete previous local file (best effort)
  if (parsed.data.image === "") {
    try {
      const current = await prisma.user.findUnique({ where: { email: session.user.email }, select: { image: true } })
      if (current?.image && current.image.startsWith("/avatars/")) {
        const prevRel = current.image.replace(/^\//, "")
        const fsPath = require("path").join(process.cwd(), "public", prevRel)
        await (await import("fs/promises")).unlink(fsPath).catch(() => {})
      }
    } catch {}
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data,
    select: { id: true, name: true, familyName: true, email: true, image: true, theme: true, palette: true, language: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(user)
}

export async function DELETE() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // fetch id and image first
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, image: true } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // delete user record
  await prisma.user.delete({ where: { id: user.id } })

  // remove avatar directory for this user (best effort)
  try {
    const dir = path.join(process.cwd(), "public", "avatars", String(user.id))
    await fs.rm(dir, { recursive: true, force: true })
  } catch {}

  return NextResponse.json({ ok: true })
}
export const runtime = "nodejs"
