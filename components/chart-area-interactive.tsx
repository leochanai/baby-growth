"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Download, ImageDown, FileDown } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useI18n } from "@/components/i18n-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const description = "Baby metric by month age"

type Baby = { id: number; name: string; gender?: string }
type Row = { id: number; babyId: number; monthAge: number; heightCm: number; weightKg: number }

export function ChartAreaInteractive({ babies, data, metric: metricProp = "height" }: { babies: Baby[]; data: Row[]; metric?: "height" | "weight" }) {
  const { t } = useI18n()
  type SexFilter = "all" | "MALE" | "FEMALE"
  const [sex, setSex] = React.useState<SexFilter>("all")
  const [metric, setMetric] = React.useState<"height" | "weight">(metricProp)
  const [who, setWho] = React.useState<{ monthAge: number; value: number }[] | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<number[]>(() => babies.map((b) => b.id))
  const chartRef = React.useRef<HTMLDivElement>(null)

  // Babies filtered by sex
  const groupBabies = React.useMemo(() => {
    const list = sex === "all" ? babies : babies.filter((b) => (b.gender || "").toUpperCase() === sex)
    // When filter changes, ensure selection remains within available list
    const currentSet = new Set(selectedIds)
    const intersected = list.map((b) => b.id).filter((id) => currentSet.has(id))
    if (intersected.length !== selectedIds.length) setSelectedIds(intersected.length ? intersected : list.map((b) => b.id))
    return list
  }, [babies, sex])

  // Fetch WHO medians when a gender filter is selected; hide for "all"
  React.useEffect(() => {
    if (sex !== "MALE" && sex !== "FEMALE") {
      setWho(null)
      return
    }
    const controller = new AbortController()
    const gender = sex === "MALE" ? "male" : "female"
    // loading indicator not shown; keep logic simple
    fetch(`/api/who-data?gender=${gender}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((items: { monthAge: number; heightMedianCm: number; weightMedianKg: number }[]) => {
        const mapped = items
          .map((i) => ({
            monthAge: i.monthAge,
            value: metric === "height" ? i.heightMedianCm : i.weightMedianKg,
          }))
          .sort((a, b) => a.monthAge - b.monthAge)
        setWho(mapped)
      })
      .catch(() => setWho(null))
      .finally(() => {})
    return () => controller.abort()
  }, [metric, sex])

  const visibleBabies = React.useMemo(() => {
    const set = new Set(selectedIds)
    return groupBabies.filter((b) => set.has(b.id))
  }, [groupBabies, selectedIds])

  // Build pivoted dataset: one series per visible baby key
  const { pivot, config, minDomain, maxDomain, ticks, yMin, yMax } = React.useMemo(() => {
    const cfg: ChartConfig = {}
    const colorPool = [210, 340, 25, 270, 140, 0, 45, 180]
    const byBaby = new Map<number, string>()
    visibleBabies.forEach((b) => {
      const key = `b${b.id}`
      byBaby.set(b.id, key)
      const idx = babies.findIndex((g) => g.id === b.id)
      const hue = colorPool[(idx >= 0 ? idx : 0) % colorPool.length]
      cfg[key] = { label: b.name, color: `hsl(${hue}, 70%, 50%)` }
    })

    // collect all months present in selected babies
    const babyMonthsSet = new Set<number>()
    data.forEach((r) => {
      if (!byBaby.has(r.babyId)) return
      babyMonthsSet.add(r.monthAge)
    })
    const monthsSet = new Set<number>(babyMonthsSet)
    if (who && (sex === "MALE" || sex === "FEMALE") && babyMonthsSet.size > 0) {
      const maxBabyMonth = Math.max(...Array.from(babyMonthsSet))
      for (const item of who) if (item.monthAge <= maxBabyMonth) monthsSet.add(item.monthAge)
      // configure WHO series (green)
      cfg["WHO"] = { label: "WHO", color: "hsl(145, 65%, 42%)" }
    }
    const months = Array.from(monthsSet).sort((a, b) => a - b)
    const babyMonths = Array.from(babyMonthsSet).sort((a, b) => a - b)
    // Domain based solely on baby months
    let minDomain = 0, maxDomain = 1
    if (babyMonths.length >= 2) {
      minDomain = babyMonths[0]
      maxDomain = babyMonths[babyMonths.length - 1]
    } else if (babyMonths.length === 1) {
      minDomain = babyMonths[0] - 1
      maxDomain = babyMonths[0] + 1
    }

    const rows = months.map((m) => {
      const row: any = { month: m }
      visibleBabies.forEach((b) => {
        const key = byBaby.get(b.id)!
        const found = data.find((r) => r.babyId === b.id && r.monthAge === m)
        const val = metric === "height" ? found?.heightCm : found?.weightKg
        row[key] = val ?? null
      })
      if (who && (sex === "MALE" || sex === "FEMALE")) {
        const w = who.find((x) => x.monthAge === m)?.value
        row["WHO"] = typeof w === "number" ? w : null
      }
      return row
    })

    // Compute Y extent across all visible series keys
    const seriesKeys = Object.keys(cfg)
    let minV = Number.POSITIVE_INFINITY
    let maxV = Number.NEGATIVE_INFINITY
    for (const r of rows) {
      for (const k of seriesKeys) {
        const v = r[k]
        if (typeof v === "number") {
          if (v < minV) minV = v
          if (v > maxV) maxV = v
        }
      }
    }
    const pad = metric === "height" ? 2 : 0.5
    let yMin = isFinite(minV) ? Math.max(0, Math.floor((minV - pad) * 10) / 10) : 0
    let yMax = isFinite(maxV) ? Math.ceil((maxV + pad) * 10) / 10 : 1
    if (!(yMax > yMin)) yMax = yMin + (metric === "height" ? 5 : 1)

    return { pivot: rows, config: cfg, minDomain, maxDomain, ticks: babyMonths, yMin, yMax }
  }, [visibleBabies, data, metric, who, sex])

  // Export helpers
  const buildFileName = React.useCallback(() => {
    const sexStr = sex === "all" ? "all" : sex === "MALE" ? "boys" : "girls"
    const metricStr = metric === "height" ? "height" : "weight"
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
    return `${metricStr}-${sexStr}-${stamp}`
  }, [sex, metric])

  function replaceCssVarsWithColors(svgText: string) {
    const host = chartRef.current
    if (!host) return svgText
    const style = getComputedStyle(host)
    // Replace all var(--color-*) with actual color values
    return svgText.replace(/var\(--color-([^)]+)\)/g, (_m, key) => {
      const val = style.getPropertyValue(`--color-${key}`).trim()
      return val || "#888"
    })
  }

  const exportSVG = React.useCallback(() => {
    const host = chartRef.current
    if (!host) return
    const svg = host.querySelector("svg") as SVGSVGElement | null
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    const raw = new XMLSerializer().serializeToString(clone)
    const inlined = replaceCssVarsWithColors(raw)
    const blob = new Blob([inlined], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${buildFileName()}.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 400)
  }, [buildFileName])

  const exportPNG = React.useCallback(async () => {
    const host = chartRef.current
    if (!host) return
    const svg = host.querySelector("svg") as SVGSVGElement | null
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    const raw = new XMLSerializer().serializeToString(clone)
    const inlined = replaceCssVarsWithColors(raw)
    const blob = new Blob([inlined], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    // Use device pixel ratio for sharper export
    const ratio = Math.max(2, Math.floor(window.devicePixelRatio || 2))
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = url
    })
    // Measure size from viewBox or bounding box
    const vb = svg.getAttribute("viewBox")?.split(" ").map(Number)
    const [vbX, vbY, vbW, vbH] = vb && vb.length === 4 ? vb : [0, 0, svg.clientWidth || 800, svg.clientHeight || 400]
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.floor(vbW * ratio))
    canvas.height = Math.max(1, Math.floor(vbH * ratio))
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-bg") || "#ffffff"
    ctx.fillStyle = "#ffffff" // white background for readability
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    const dataUrl = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${buildFileName()}.png`
    a.click()
  }, [buildFileName])

  const allIdsOfGroup = React.useMemo(() => groupBabies.map((b) => b.id), [groupBabies])
  const allSelected = selectedIds.length === allIdsOfGroup.length && allIdsOfGroup.length > 0
  const noneSelected = selectedIds.length === 0

  return (
    <Card className="@container/card flex h-full flex-col">
      <CardHeader>
        <CardTitle>{metric === "height" ? t("charts.heightByAgeTitle") : t("charts.weightByAgeTitle")}</CardTitle>
        <CardDescription>{metric === "height" ? t("charts.heightByAgeDesc") : t("charts.weightByAgeDesc")}</CardDescription>
        <CardAction className="flex items-center gap-2">
          {/* Sex segmented control */}
          <ToggleGroup type="single" variant="outline" value={sex} onValueChange={(v) => v && setSex(v as SexFilter)} size="sm" className="bg-transparent">
            <ToggleGroupItem value="all" aria-label={t("charts.filters.all")} className="data-[state=on]:bg-accent/60 data-[state=on]:text-accent-foreground hover:bg-accent/40">
              {t("charts.filters.all")}
            </ToggleGroupItem>
            <ToggleGroupItem value="MALE" aria-label={t("charts.filters.boys")} className="data-[state=on]:bg-accent/60 data-[state=on]:text-accent-foreground hover:bg-accent/40">
              {t("charts.filters.boys")}
            </ToggleGroupItem>
            <ToggleGroupItem value="FEMALE" aria-label={t("charts.filters.girls")} className="data-[state=on]:bg-accent/60 data-[state=on]:text-accent-foreground hover:bg-accent/40">
              {t("charts.filters.girls")}
            </ToggleGroupItem>
          </ToggleGroup>
          {/* Metric segmented control */}
          <ToggleGroup type="single" variant="outline" value={metric} onValueChange={(v) => v && setMetric(v as any)} size="sm" className="bg-transparent">
            <ToggleGroupItem value="height" className="data-[state=on]:bg-accent/60 data-[state=on]:text-accent-foreground hover:bg-accent/40">{t("charts.metric.height")}</ToggleGroupItem>
            <ToggleGroupItem value="weight" className="data-[state=on]:bg-accent/60 data-[state=on]:text-accent-foreground hover:bg-accent/40">{t("charts.metric.weight")}</ToggleGroupItem>
          </ToggleGroup>

          {/* Export menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label={t("charts.export.label")}> 
                <Download className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={exportPNG} className="gap-2">
                <ImageDown className="size-4" /> {t("charts.export.png")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSVG} className="gap-2">
                <FileDown className="size-4" /> {t("charts.export.svg")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex flex-1 min-h-0 flex-col">
        <div ref={chartRef} className="min-h-0 flex-1">
          <ChartContainer config={config} className="aspect-auto h-full w-full">
            <LineChart data={pivot}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                type="number"
                domain={[minDomain, maxDomain]}
                ticks={ticks}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => `${value}${t("charts.units.month")}`}
              />
              <YAxis tickLine={false} axisLine={false} width={40} domain={[yMin, yMax]} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    nameKey="dataKey"
                    labelFormatter={(_value, items) => {
                      const m = Array.isArray(items) && items[0] && (items[0] as any).payload?.month
                      const month = typeof m === 'number' ? m : ''
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t("babyData.fields.monthAge")}:</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">{month}{t("charts.units.month")}</span>
                        </div>
                      )
                    }}
                    formatter={(value, name) => {
                      const babyName = visibleBabies.find((b) => `b${b.id}` === String(name))?.name || String(name)
                      return (
                        <>
                          <span className="text-muted-foreground">{babyName}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">{typeof value === 'number' ? value.toFixed(1) : value} {metric === "height" ? t("charts.units.cm") : t("charts.units.kg")}</span>
                        </>
                      )
                    }}
                    indicator="dot"
                  />
                }
              />
              {visibleBabies.map((b) => (
                <Line
                  key={b.id}
                  type="monotone"
                  dataKey={`b${b.id}`}
                  stroke={`var(--color-b${b.id})`}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
              {who && (sex === "MALE" || sex === "FEMALE") ? (
                <Line
                  type="monotone"
                  dataKey="WHO"
                  stroke={`var(--color-WHO)`}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ) : null}
            </LineChart>
          </ChartContainer>
        </div>

        {/* Names checklist */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(allIdsOfGroup)} disabled={allSelected}>
              {t("charts.legend.selectAll")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds([])} disabled={noneSelected}>
              {t("charts.legend.clear")}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {groupBabies.map((b) => {
              const checked = selectedIds.includes(b.id)
              const idx = babies.findIndex((g) => g.id === b.id)
              const colorH = [210, 340, 25, 270, 140, 0, 45, 180][(idx >= 0 ? idx : 0) % 8]
              return (
                <label key={b.id} className="border-input hover:bg-accent/40 focus-within:ring-ring/50 flex items-center gap-2 rounded-md border p-2 text-sm outline-none transition-[color,box-shadow]">
                  <span className="h-3 w-3 shrink-0 rounded-[2px]" style={{ backgroundColor: `hsl(${colorH}, 70%, 50%)` }} />
                  <span className="flex-1 truncate" title={b.name}>{b.name}</span>
                  <Checkbox checked={checked} onCheckedChange={(v) => {
                    const on = Boolean(v)
                    setSelectedIds((ids) => (on ? Array.from(new Set([...ids, b.id])) : ids.filter((x) => x !== b.id)))
                  }} />
                </label>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
