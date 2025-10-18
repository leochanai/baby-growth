"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

// import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { useI18n } from "@/components/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export const description = "Baby metric by month age"

type Baby = { id: number; name: string; gender?: string }
type Row = { id: number; babyId: number; monthAge: number; heightCm: number; weightKg: number }

// Config is generated dynamically per series (one per baby)

export function ChartAreaInteractive({ babies, data, metric = "height" }: { babies: Baby[]; data: Row[]; metric?: "height" | "weight" }) {
  const { t } = useI18n()
  type Filter = "all" | "MALE" | "FEMALE"
  const [filter, setFilter] = React.useState<Filter>("all")
  const [who, setWho] = React.useState<{ monthAge: number; value: number }[] | null>(null)
  const [whoLoading, setWhoLoading] = React.useState(false)

  // nothing

  const groupBabies = React.useMemo(() => {
    if (filter === "all") return babies
    return babies.filter((b) => (b.gender || "").toUpperCase() === filter)
  }, [babies, filter])

  // Fetch WHO medians when a gender filter is selected
  React.useEffect(() => {
    if (filter !== "MALE" && filter !== "FEMALE") {
      setWho(null)
      return
    }
    const controller = new AbortController()
    const gender = filter === "MALE" ? "male" : "female"
    setWhoLoading(true)
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
      .finally(() => setWhoLoading(false))
    return () => controller.abort()
  }, [metric, filter])

  // Build pivoted dataset: one series per baby key
  const { pivot, config, minDomain, maxDomain, ticks } = React.useMemo(() => {
    const keys: string[] = []
    const cfg: ChartConfig = {}
    const colorPool = [210, 340, 25, 270, 140, 0, 45, 180]
    const byBaby = new Map<number, string>()
    groupBabies.forEach((b, i) => {
      const key = `b${b.id}`
      keys.push(key)
      byBaby.set(b.id, key)
      const hue = colorPool[i % colorPool.length]
      cfg[key] = { label: b.name, color: `hsl(${hue}, 70%, 50%)` }
    })

    // collect all months present in selected babies
    const babyMonthsSet = new Set<number>()
    data.forEach((r) => {
      if (!byBaby.has(r.babyId)) return
      babyMonthsSet.add(r.monthAge)
    })
    const monthsSet = new Set<number>(babyMonthsSet)
    if (who && (filter === "MALE" || filter === "FEMALE") && babyMonthsSet.size > 0) {
      const maxBabyMonth = Math.max(...Array.from(babyMonthsSet))
      for (const item of who) if (item.monthAge <= maxBabyMonth) monthsSet.add(item.monthAge)
      // configure WHO series (green)
      cfg["WHO"] = { label: "WHO", color: "hsl(145, 65%, 42%)" }
      keys.push("WHO")
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
      groupBabies.forEach((b) => {
        const key = byBaby.get(b.id)!
        const found = data.find((r) => r.babyId === b.id && r.monthAge === m)
        const val = metric === "height" ? found?.heightCm : found?.weightKg
        row[key] = val ?? null
      })
      if (who && (filter === "MALE" || filter === "FEMALE")) {
        const w = who.find((x) => x.monthAge === m)?.value
        row["WHO"] = typeof w === "number" ? w : null
      }
      return row
    })

    return { pivot: rows, config: cfg, minDomain, maxDomain, ticks: babyMonths }
  }, [groupBabies, data, metric, who, filter])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{metric === "height" ? t("charts.heightByAgeTitle") : t("charts.weightByAgeTitle")}</CardTitle>
        <CardDescription>{metric === "height" ? t("charts.heightByAgeDesc") : t("charts.weightByAgeDesc")}</CardDescription>
        <CardAction>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-40" size="sm" aria-label={t("charts.heightByAgeTitle")}> 
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">{t("charts.filters.all")}</SelectItem>
              <SelectItem value="MALE" className="rounded-lg">{t("charts.filters.boys")}</SelectItem>
              <SelectItem value="FEMALE" className="rounded-lg">{t("charts.filters.girls")}</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
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
            <YAxis tickLine={false} axisLine={false} width={40} />
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
                    const babyName = groupBabies.find((b) => `b${b.id}` === String(name))?.name || String(name)
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
            {groupBabies.map((b) => (
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
            {who && (filter === "MALE" || filter === "FEMALE") ? (
              <Line
                type="monotone"
                dataKey="WHO"
                stroke={`var(--color-WHO)`}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ) : null}
            <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
