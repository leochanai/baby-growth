import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import path from "path"
import fs from "fs/promises"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email! }, select: { id: true, image: true } })
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 })
  }

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg"
  const fname = `${Date.now()}${ext}`
  const rel = path.posix.join("/avatars", dbUser.id, fname)
  const outPath = path.join(process.cwd(), "public", rel)
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  const buf = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(outPath, buf)
  // best-effort delete previous local avatar if belonged to our storage
  try {
    const prev = dbUser.image
    if (prev && prev.startsWith("/avatars/")) {
      const prevPath = path.join(process.cwd(), "public", prev)
      await fs.unlink(prevPath).catch(() => {})
    }
  } catch {}

  return NextResponse.json({ url: rel })
}
