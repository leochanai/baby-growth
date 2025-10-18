"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

// import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export const description = "Baby height by month age"

type Baby = { id: number; name: string }
type Row = { id: number; babyId: number; monthAge: number; heightCm: number }

const chartConfig = {
  height: {
    label: "Height (cm)",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ babies, data }: { babies: Baby[]; data: Row[] }) {
  const [selectedBabyId, setSelectedBabyId] = React.useState<string>(babies[0]?.id ? String(babies[0].id) : "")

  React.useEffect(() => {
    if (!babies.find((b) => String(b.id) === selectedBabyId)) {
      setSelectedBabyId(babies[0]?.id ? String(babies[0].id) : "")
    }
  }, [babies])

  const filteredData = React.useMemo(() => {
    const bid = Number(selectedBabyId)
    return data
      .filter((r) => (Number.isNaN(bid) || !bid ? true : r.babyId === bid))
      .map((r) => ({ month: r.monthAge, height: r.heightCm }))
      .sort((a, b) => a.month - b.month)
  }, [data, selectedBabyId])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>宝宝身高图</CardTitle>
        <CardDescription>按月龄展示身高（cm）</CardDescription>
        <CardAction>
          <Select value={selectedBabyId} onValueChange={setSelectedBabyId}>
            <SelectTrigger className="w-40" size="sm" aria-label="选择宝宝">
              <SelectValue placeholder="选择宝宝" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {babies.map((b) => (
                <SelectItem key={b.id} value={String(b.id)} className="rounded-lg">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillHeight" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-height)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-height)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => `${value}月`}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `月龄：${value}`}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="height"
              type="natural"
              fill="url(#fillHeight)"
              stroke="var(--color-height)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
