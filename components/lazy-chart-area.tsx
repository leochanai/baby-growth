"use client"

import dynamic from "next/dynamic"

const LazyChart = dynamic(() => import("@/components/chart-area-interactive").then(m => m.ChartAreaInteractive), {
  ssr: false,
  loading: () => (
    <div className="border bg-card text-card-foreground rounded-xl shadow-sm">
      <div className="px-6 py-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="px-6 pb-6">
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  ),
})

export default LazyChart

