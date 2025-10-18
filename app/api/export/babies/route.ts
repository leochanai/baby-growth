import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function toCsv(rows: any[], headers: string[], pick: (row: any) => any[]) {
  const ESCAPE_RE = /[",\n]/
  const escape = (v: any) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    return ESCAPE_RE.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = headers.join(",")
  const body = rows.map((r) => pick(r).map(escape).join(",")).join("\n")
  return head + "\n" + body + (body ? "\n" : "")
}

export async function GET() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const babies = await prisma.baby.findMany({
    where: { userId: user.id },
    orderBy: { id: "asc" },
    select: { id: true, name: true, gender: true, birthDate: true, createdAt: true, updatedAt: true },
  })

  const csv = toCsv(
    babies,
    ["id", "name", "gender", "birthDate"],
    (r) => [r.id, r.name, r.gender, r.birthDate.toISOString().slice(0, 10)]
  )

  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="babies-${date}.csv"`,
    },
  })
}
