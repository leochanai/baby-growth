"use client"

import * as React from "react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  mode?: "single"
  selected?: Date
  onSelect?: (date?: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function Calendar({ mode = "single", selected, onSelect, disabled, className }: Props) {
  const today = new Date()
  const [view, setView] = React.useState<Date>(selected ?? today)

  function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  function daysInMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  }
  const first = startOfMonth(view)
  const firstWeekday = (first.getDay() + 7) % 7 // 0=Sun
  const total = daysInMonth(view)
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = new Array(firstWeekday).fill(null)
  for (let i = 1; i <= total; i++) {
    week.push(new Date(view.getFullYear(), view.getMonth(), i))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week) }

  function isSameDay(a?: Date | null, b?: Date | null) {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  return (
    <div className={cn("p-2 w-[280px]", className)}>
      <div className="flex items-center justify-between px-2 py-1">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
          <IconChevronLeft className="size-4" />
          <span className="sr-only">Prev</span>
        </Button>
        <div className="text-sm font-medium">
          {view.getFullYear()}-{String(view.getMonth() + 1).padStart(2, '0')}
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
          <IconChevronRight className="size-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 text-center text-xs text-muted-foreground">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (<div key={d}>{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {weeks.flat().map((d, idx) => (
          <button
            key={idx}
            disabled={!d || (disabled?.(d) ?? false)}
            onClick={() => d && onSelect?.(d)}
            className={cn(
              "h-8 rounded-md text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed",
              isSameDay(d, selected) && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {d ? d.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

