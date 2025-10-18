/*
  Import WHO growth standards from docs/WHO.md → WhoData table

  - Parses two sections in Markdown:
    1) Weight tables (male, female) with Median (kg)
    2) Height tables (male, female) with Median (cm)
  - Merges by (gender, monthAge) and upserts into Prisma model WhoData
  - Unique constraint: (gender, monthAge)

  Usage:
    node scripts/import-who.js
*/

const fs = require("fs")
const path = require("path")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

/** @typedef {"male"|"female"} Gender */

/**
 * Parse a Markdown table block into rows
 * Returns array of [monthAge:number, median:number]
 */
function parseMarkdownTableToPairs(lines) {
  const pairs = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("|") || /^\|\s*:?-+/.test(trimmed)) continue // skip non-rows and header delimiter
    const parts = trimmed
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    // Expect: [月份, -1SD, 中位数, +1SD]
    if (parts.length < 4) continue
    const m = Number(parts[0])
    const median = Number(parts[2])
    if (Number.isFinite(m) && Number.isFinite(median)) {
      pairs.push([m, median])
    }
  }
  return pairs
}

/**
 * Extract WHO medians from the WHO.md content.
 * Returns { weight: { male: Map, female: Map }, height: { male: Map, female: Map } }
 */
function extractWhoMedians(md) {
  const lines = md.split(/\r?\n/) // keep it simple

  /** @type {Record<string, Map<number, number>>} */
  const weight = { male: new Map(), female: new Map() }
  /** @type {Record<string, Map<number, number>>} */
  const height = { male: new Map(), female: new Map() }

  let mode = /** @type{"weight"|"height"} */ ("weight")
  let currentGender = /** @type{Gender|null} */ (null)
  let collecting = false
  /** @type {string[]} */
  let tableBuffer = []

  const flushTable = () => {
    if (!currentGender || tableBuffer.length === 0) return
    const data = parseMarkdownTableToPairs(tableBuffer)
    const target = mode === "weight" ? weight : height
    for (const [m, v] of data) target[currentGender].set(m, v)
    tableBuffer = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()

    // Switch to height section when hitting the hr or explicit title
    if (t === "***" || /宝宝身高标准表/.test(t)) {
      flushTable()
      mode = "height"
      currentGender = null
      collecting = false
      continue
    }

    // Detect gender headings
    if (/^\*\*\s*男宝宝/.test(t)) {
      flushTable()
      currentGender = "male"
      collecting = false
      continue
    }
    if (/^\*\*\s*女宝宝/.test(t)) {
      flushTable()
      currentGender = "female"
      collecting = false
      continue
    }

    // Start collecting when a table header appears after gender set
    if (currentGender && /^\|\s*月份/.test(t)) {
      collecting = true
      tableBuffer = []
      continue
    }

    if (collecting) {
      if (t.startsWith("|")) {
        tableBuffer.push(line)
        continue
      }
      // End of table on first non-table line
      collecting = false
      flushTable()
    }
  }
  // Final flush
  flushTable()

  return { weight, height }
}

async function main() {
  const mdPath = path.join(__dirname, "..", "docs", "WHO.md")
  const md = fs.readFileSync(mdPath, "utf8")
  const { weight, height } = extractWhoMedians(md)

  /** @type {{ gender: Gender, monthAge: number, heightMedianCm: number, weightMedianKg: number }[]} */
  const rows = []
  /** @type {Gender[]} */
  const genders = ["male", "female"]
  for (const g of genders) {
    const months = new Set([...weight[g].keys(), ...height[g].keys()])
    for (const m of months) {
      const w = weight[g].get(m)
      const h = height[g].get(m)
      if (typeof w !== "number" || typeof h !== "number") {
        // Skip incomplete pairs but log
        console.warn(`[WARN] Skipping ${g} month ${m}: missing ${typeof w !== "number" ? "weight" : "height"}`)
        continue
      }
      rows.push({ gender: g, monthAge: m, heightMedianCm: h, weightMedianKg: w })
    }
  }

  let created = 0, updated = 0
  for (const r of rows) {
    const existing = await prisma.whoData.findUnique({
      where: { gender_monthAge: { gender: r.gender, monthAge: r.monthAge } },
      select: { id: true },
    })
    await prisma.whoData.upsert({
      where: { gender_monthAge: { gender: r.gender, monthAge: r.monthAge } },
      create: r,
      update: { heightMedianCm: r.heightMedianCm, weightMedianKg: r.weightMedianKg },
    })
    if (existing) updated++
    else created++
  }

  console.log("WHO import complete:", { total: rows.length, created, updated })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect().finally(() => process.exit(1))
  })

