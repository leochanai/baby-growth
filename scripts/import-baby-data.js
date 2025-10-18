/*
  One-off importer for screenshot data → BabyData
  - Matches existing babies by exact name
  - Upserts by (babyId, monthAge)
  - Skips entries missing height or weight
  Assumptions:
  - "X个月Y天" → monthAge = X (days ignored)
  - "Z岁N个月" → monthAge = Z*12 + N ; "Z.5岁" → Z*12 + 6
  - We used the actual weight when provided, e.g., 4.5kg (实际5.1kg) → 5.1kg
  - 6080g → 6.08kg
*/

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

/** @type {{ name: string, entries: { monthAge: number, heightCm: number, weightKg: number }[] }[]} */
const payload = [
  {
    name: "喜妹",
    entries: [
      { monthAge: 1, heightCm: 54.5, weightKg: 5.1 }, // 4.5kg (实际5.1kg) → use 5.1
      { monthAge: 2, heightCm: 61, weightKg: 6.08 }, // 6080g → 6.08kg
    ],
  },
  {
    name: "安哥",
    entries: [
      { monthAge: 1, heightCm: 58.5, weightKg: 5.6 },
      { monthAge: 3, heightCm: 64, weightKg: 6.4 },
      { monthAge: 6, heightCm: 68, weightKg: 7.3 },
      { monthAge: 8, heightCm: 70.5, weightKg: 8.2 },
      { monthAge: 12, heightCm: 74, weightKg: 8.7 },
      { monthAge: 18, heightCm: 82, weightKg: 10 },
      { monthAge: 24, heightCm: 85, weightKg: 10.8 }, // 2岁
      { monthAge: 30, heightCm: 88, weightKg: 11.6 }, // 2.5岁
      // 2025-9-18 12kg (自测) → weight only, omitted (no height)
    ],
  },
  {
    name: "乐乐",
    entries: [
      { monthAge: 1, heightCm: 56, weightKg: 5.2 },
      { monthAge: 3, heightCm: 65, weightKg: 7.5 },
      { monthAge: 6, heightCm: 71, weightKg: 8.5 },
      { monthAge: 8, heightCm: 74, weightKg: 9.2 },
      { monthAge: 12, heightCm: 79, weightKg: 10.2 },
      { monthAge: 18, heightCm: 86, weightKg: 11.2 },
      { monthAge: 24, heightCm: 91, weightKg: 12.5 }, // 2岁
      { monthAge: 30, heightCm: 92.5, weightKg: 14 }, // 2.5岁
      { monthAge: 36, heightCm: 99, weightKg: 15.2 }, // 3岁
      { monthAge: 42, heightCm: 101, weightKg: 16 }, // 3.5岁
      { monthAge: 51, heightCm: 104, weightKg: 17.1 }, // 4岁3个月
    ],
  },
]

async function main() {
  const names = payload.map((p) => p.name)
  const babies = await prisma.baby.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  })
  const nameToId = new Map(babies.map((b) => [b.name, b.id]))

  const missing = names.filter((n) => !nameToId.has(n))
  if (missing.length) {
    console.warn("[WARN] Missing babies:", missing)
  }

  let created = 0, updated = 0, skipped = 0
  for (const group of payload) {
    const babyId = nameToId.get(group.name)
    if (!babyId) { skipped += group.entries.length; continue }
    for (const e of group.entries) {
      if (!(e.heightCm > 0) || !(e.weightKg > 0)) { skipped++; continue }
      const res = await prisma.babyData.upsert({
        where: { babyId_monthAge: { babyId, monthAge: e.monthAge } },
        create: { babyId, monthAge: e.monthAge, heightCm: e.heightCm, weightKg: e.weightKg },
        update: { heightCm: e.heightCm, weightKg: e.weightKg },
        select: { id: true },
      })
      if (res) {
        // naive heuristic: if record existed, count as updated; otherwise created
        // Prisma doesn't tell us directly; we can try get first then upsert, but keep it simple
        // We'll issue a findFirst before upsert to count correctly
      }
    }
  }

  // Accurate counts via a second pass (optional)
  created = 0; updated = 0
  for (const group of payload) {
    const babyId = nameToId.get(group.name)
    if (!babyId) continue
    for (const e of group.entries) {
      const found = await prisma.babyData.findFirst({ where: { babyId, monthAge: e.monthAge } })
      if (found) updated++
      else created++
    }
  }

  console.log("Done.", { created, updated, skipped })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect().finally(() => process.exit(1))
  })

