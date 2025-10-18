import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// ---- CSV helpers ----
function toText(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes)
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const n = text.length
  let cur: string[] = []
  let field = ""
  let inQuotes = false
  while (i < n) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < n && text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ',') { cur.push(field); field = ""; i++; continue }
    if (ch === '\n' || ch === '\r') {
      // consume CRLF
      if (ch === '\r' && i + 1 < n && text[i + 1] === '\n') i++
      cur.push(field); rows.push(cur); cur = []; field = ""; i++; continue
    }
    field += ch; i++
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur) }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ""))
}

// ---- ZIP (store-only) reader ----
function readUint16LE(view: DataView, off: number) { return view.getUint16(off, true) }
function readUint32LE(view: DataView, off: number) { return view.getUint32(off, true) }

function unzipStoreOnly(bytes: Uint8Array): Record<string, Uint8Array> {
  const buf = bytes
  const len = buf.length
  const SIGN_EOCD = 0x06054b50
  const SIGN_CEN = 0x02014b50
  const SIGN_LFH = 0x04034b50
  // find EOCD within last 64k
  let eocd = -1
  for (let i = Math.max(0, len - 65558); i <= len - 22; i++) {
    const sig = (buf[i]) | (buf[i+1] << 8) | (buf[i+2] << 16) | (buf[i+3] << 24)
    if (sig >>> 0 === SIGN_EOCD) { eocd = i; break }
  }
  if (eocd < 0) throw new Error("Invalid ZIP: EOCD not found")
  const eview = new DataView(buf.buffer, buf.byteOffset + eocd, 22)
  const cdSize = readUint32LE(eview, 12)
  const cdOffset = readUint32LE(eview, 16)
  const files: { name: string; lfhOff: number; size: number; method: number }[] = []
  let p = cdOffset
  while (p < cdOffset + cdSize) {
    const v = new DataView(buf.buffer, buf.byteOffset + p, 46)
    const sig = readUint32LE(v, 0)
    if (sig !== SIGN_CEN) throw new Error("Invalid ZIP: CEN signature")
    const method = readUint16LE(v, 10)
    const size = readUint32LE(v, 24)
    const nameLen = readUint16LE(v, 28)
    const extraLen = readUint16LE(v, 30)
    const commentLen = readUint16LE(v, 32)
    const lfhOff = readUint32LE(v, 42)
    const nameBytes = buf.slice(p + 46, p + 46 + nameLen)
    const name = new TextDecoder().decode(nameBytes)
    files.push({ name, lfhOff, size, method })
    p += 46 + nameLen + extraLen + commentLen
  }
  const out: Record<string, Uint8Array> = {}
  for (const f of files) {
    const v = new DataView(buf.buffer, buf.byteOffset + f.lfhOff, 30)
    const sig = readUint32LE(v, 0)
    if (sig !== SIGN_LFH) throw new Error("Invalid ZIP: LFH signature")
    const nameLen = readUint16LE(v, 26)
    const extraLen = readUint16LE(v, 28)
    if (readUint16LE(v, 8) !== 0) throw new Error("Unsupported ZIP: compressed entries")
    const dataStart = f.lfhOff + 30 + nameLen + extraLen
    out[f.name] = buf.slice(dataStart, dataStart + f.size)
  }
  return out
}

export async function POST(req: Request) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  const mode = (form.get("mode") as string | null) === "replace" ? "replace" : "append"
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  const bytes = new Uint8Array(await file.arrayBuffer())

  let files: Record<string, Uint8Array>
  try {
    files = unzipStoreOnly(bytes)
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid zip file" }, { status: 400 })
  }
  const babiesCsv = files["babies.csv"]
  const dataCsv = files["baby-data.csv"]
  if (!babiesCsv || !dataCsv) return NextResponse.json({ error: "Missing babies.csv or baby-data.csv" }, { status: 400 })

  // Parse CSVs
  const babiesRows = parseCsv(toText(babiesCsv))
  const dataRows = parseCsv(toText(dataCsv))
  const [bh, ...bb] = babiesRows
  const [dh, ...dd] = dataRows
  const hmap = (arr: string[]) => Object.fromEntries(arr.map((k, i) => [k.trim(), i])) as Record<string, number>
  const bidx = hmap(bh)
  const didx = hmap(dh)

  const babiesParsed = bb
    .filter((r) => r.length >= 4)
    .map((r) => ({
      name: r[bidx["name"]] ?? "",
      gender: r[bidx["gender"]] ?? "MALE",
      birthDate: r[bidx["birthDate"]] ?? "",
    }))
    .filter((x) => x.name)

  const dataParsed = dd
    .filter((r) => r.length >= 7)
    .map((r) => ({
      babyName: r[didx["babyName"]] ?? "",
      monthAge: Number(r[didx["monthAge"]] ?? "0"),
      heightCm: Number(r[didx["heightCm"]] ?? "0"),
      weightKg: Number(r[didx["weightKg"]] ?? "0"),
    }))
    .filter((x) => x.babyName && x.monthAge >= 0 && x.heightCm > 0 && x.weightKg > 0)

  let stats: any = { mode, babies: { created: 0, removed: 0 }, data: { created: 0, updated: 0, skipped: 0 } }
  if (mode === "replace") {
    await prisma.$transaction(async (tx) => {
      // Remove existing
      const delData = await tx.babyData.deleteMany({ where: { baby: { userId: user.id } } })
      const delBabies = await tx.baby.deleteMany({ where: { userId: user.id } })
      stats.babies.removed = delBabies.count
      // Create babies
      const created: { [name: string]: number } = {}
      for (const b of babiesParsed) {
        const createdBaby = await tx.baby.create({ data: { userId: user.id, name: b.name, gender: b.gender, birthDate: new Date(b.birthDate) }, select: { id: true } })
        created[b.name] = createdBaby.id
        stats.babies.created++
      }
      for (const d of dataParsed) {
        const babyId = created[d.babyName]
        if (!babyId) { stats.data.skipped++; continue }
        await tx.babyData.create({ data: { babyId, monthAge: d.monthAge, heightCm: d.heightCm, weightKg: d.weightKg } })
        stats.data.created++
      }
    })
  } else {
    // append: upsert babies by name, then upsert data by (babyId, monthAge)
    const existing = await prisma.baby.findMany({ where: { userId: user.id }, select: { id: true, name: true } })
    const nameToId = new Map(existing.map((b) => [b.name, b.id]))
    for (const b of babiesParsed) {
      if (!nameToId.has(b.name)) {
        const created = await prisma.baby.create({ data: { userId: user.id, name: b.name, gender: b.gender, birthDate: new Date(b.birthDate) }, select: { id: true } })
        nameToId.set(b.name, created.id)
        stats.babies.created++
      }
    }
    for (const d of dataParsed) {
      const babyId = nameToId.get(d.babyName)
      if (!babyId) { stats.data.skipped++; continue }
      const found = await prisma.babyData.findUnique({ where: { babyId_monthAge: { babyId, monthAge: d.monthAge } }, select: { id: true } })
      if (found) {
        await prisma.babyData.update({ where: { id: found.id }, data: { heightCm: d.heightCm, weightKg: d.weightKg } })
        stats.data.updated++
      } else {
        await prisma.babyData.create({ data: { babyId, monthAge: d.monthAge, heightCm: d.heightCm, weightKg: d.weightKg } })
        stats.data.created++
      }
    }
  }

  return NextResponse.json({ ok: true, stats })
}
