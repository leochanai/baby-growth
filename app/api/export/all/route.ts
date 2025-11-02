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

// Minimal ZIP (store-only) builder
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ TABLE[(c ^ bytes[i]) & 0xff]
  }
  return (c ^ 0xffffffff) >>> 0
}

const TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

function dosDateTime(d: Date) {
  const year = Math.max(1980, d.getUTCFullYear()) - 1980
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const hours = d.getUTCHours()
  const minutes = d.getUTCMinutes()
  const seconds = Math.floor(d.getUTCSeconds() / 2)
  const dosTime = (hours << 11) | (minutes << 5) | seconds
  const dosDate = (year << 9) | (month << 5) | day
  return { dosTime, dosDate }
}

function encodeUtf8(s: string) {
  return new TextEncoder().encode(s)
}

function writeUint16LE(view: DataView, offset: number, val: number) {
  view.setUint16(offset, val & 0xffff, true)
}
function writeUint32LE(view: DataView, offset: number, val: number) {
  view.setUint32(offset, val >>> 0, true)
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const lfhs: { name: Uint8Array; offset: number; crc: number; size: number; time: number; date: number }[] = []
  const chunks: Uint8Array[] = []
  let offset = 0
  const now = new Date()
  for (const f of files) {
    const nameBytes = encodeUtf8(f.name)
    const { dosTime, dosDate } = dosDateTime(now)
    const crc = crc32(f.data)
    const size = f.data.byteLength

    const header = new ArrayBuffer(30 + nameBytes.byteLength)
    const view = new DataView(header)
    writeUint32LE(view, 0, 0x04034b50)
    writeUint16LE(view, 4, 20) // version needed
    writeUint16LE(view, 6, 0x0800) // UTF-8 names
    writeUint16LE(view, 8, 0) // method store
    writeUint16LE(view, 10, dosTime)
    writeUint16LE(view, 12, dosDate)
    writeUint32LE(view, 14, crc)
    writeUint32LE(view, 18, size)
    writeUint32LE(view, 22, size)
    writeUint16LE(view, 26, nameBytes.byteLength)
    writeUint16LE(view, 28, 0) // extra len
    const lfh = new Uint8Array(header)
    lfh.set(nameBytes, 30)
    chunks.push(lfh, f.data)
    lfhs.push({ name: nameBytes, offset, crc, size, time: dosTime, date: dosDate })
    offset += lfh.byteLength + size
  }

  // Central directory
  const cdChunks: Uint8Array[] = []
  let cdSize = 0
  for (const f of lfhs) {
    const cdhdr = new ArrayBuffer(46 + f.name.byteLength)
    const v = new DataView(cdhdr)
    writeUint32LE(v, 0, 0x02014b50)
    writeUint16LE(v, 4, 20) // version made by
    writeUint16LE(v, 6, 20) // version needed
    writeUint16LE(v, 8, 0x0800)
    writeUint16LE(v, 10, 0)
    writeUint16LE(v, 12, f.time)
    writeUint16LE(v, 14, f.date)
    writeUint32LE(v, 16, f.crc)
    writeUint32LE(v, 20, f.size)
    writeUint32LE(v, 24, f.size)
    writeUint16LE(v, 28, f.name.byteLength)
    writeUint16LE(v, 30, 0) // extra
    writeUint16LE(v, 32, 0) // comment
    writeUint16LE(v, 34, 0) // disk start
    writeUint16LE(v, 36, 0) // int attr
    writeUint32LE(v, 38, 0) // ext attr
    writeUint32LE(v, 42, f.offset)
    const cd = new Uint8Array(cdhdr)
    cd.set(f.name, 46)
    cdChunks.push(cd)
    cdSize += cd.byteLength
  }
  const cdOffset = offset
  const end = new ArrayBuffer(22)
  const ve = new DataView(end)
  writeUint32LE(ve, 0, 0x06054b50)
  writeUint16LE(ve, 4, 0)
  writeUint16LE(ve, 6, 0)
  writeUint16LE(ve, 8, lfhs.length)
  writeUint16LE(ve, 10, lfhs.length)
  writeUint32LE(ve, 12, cdSize)
  writeUint32LE(ve, 16, cdOffset)
  writeUint16LE(ve, 20, 0) // comment len

  const totalLen = offset + cdSize + 22
  const out = new Uint8Array(totalLen)
  let p = 0
  for (const c of chunks) {
    out.set(c, p)
    p += c.byteLength
  }
  for (const c of cdChunks) {
    out.set(c, p)
    p += c.byteLength
  }
  out.set(new Uint8Array(end), p)
  return out
}

export async function GET() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [babies, data] = await Promise.all([
    prisma.baby.findMany({
      where: { userId: user.id },
      orderBy: { id: "asc" },
      select: { id: true, name: true, gender: true, birthDate: true },
    }),
    prisma.babyData.findMany({
      where: { baby: { userId: user.id } },
      orderBy: [{ babyId: "asc" }, { monthAge: "asc" }],
      select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true, createdAt: true, baby: { select: { name: true } } },
    }),
  ])

  const babiesCsv = toCsv(
    babies,
    ["id", "name", "gender", "birthDate"],
    (r) => [r.id, r.name, r.gender, r.birthDate.toISOString().slice(0, 10)]
  )
  const babyDataCsv = toCsv(
    data,
    ["id", "babyId", "babyName", "monthAge", "heightCm", "weightKg", "createdAt"],
    (r) => [r.id, r.babyId, r.baby?.name ?? "", r.monthAge, r.heightCm, r.weightKg, r.createdAt.toISOString()]
  )

  const zipBytes = zipStore([
    { name: "babies.csv", data: new TextEncoder().encode(babiesCsv) },
    { name: "baby-data.csv", data: new TextEncoder().encode(babyDataCsv) },
  ])

  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" })
  return new Response(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="baby-growth-export-${date}.zip"`,
    },
  })
}
