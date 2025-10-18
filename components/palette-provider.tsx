"use client"

import React from "react"

type Palette =
  | "theme-default"
  | "theme-red"
  | "theme-orange"
  | "theme-green"
  | "theme-blue"
  | "theme-yellow"
  | "theme-violet"

type Ctx = { palette: Palette; setPalette: (p: Palette) => void }
const PaletteContext = React.createContext<Ctx | null>(null)

const PALETTE_KEY = "palette"
const ALL = [
  "theme-default",
  "theme-red",
  "theme-orange",
  "theme-green",
  "theme-blue",
  "theme-yellow",
  "theme-violet",
] as const
// Old class names we want to clean up from the <html> element
const LEGACY = ["theme-neutral", "theme-stone", "theme-zinc", "theme-gray", "theme-slate"] as const

export function usePalette() {
  const ctx = React.useContext(PaletteContext)
  if (!ctx) throw new Error("usePalette must be used within PaletteProvider")
  return ctx
}

export function PaletteProvider({ children, initialPalette }: { children: React.ReactNode, initialPalette?: Palette }) {
  // Initialize from SSR-provided palette to avoid any flicker.
  const [palette, setPaletteState] = React.useState<Palette>(initialPalette ?? "theme-default")

  const setPalette = React.useCallback((p: Palette) => {
    setPaletteState(p)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PALETTE_KEY, p)
      try {
        document.cookie = `palette=${encodeURIComponent(p)}; path=/; max-age=31536000; samesite=lax`
      } catch {}
      const el = document.documentElement
      ;[...ALL, ...LEGACY].forEach((c) => el.classList.remove(c))
      el.classList.add(p)
    }
  }, [])

  // On mount, sync from localStorage (and migrate legacy)
  React.useEffect(() => {
    try {
      const savedRaw = window.localStorage.getItem(PALETTE_KEY)
      let next: Palette | null = null
      if (savedRaw && LEGACY.includes(savedRaw as any)) {
        next = savedRaw === "theme-neutral" ? "theme-default" : "theme-default"
      } else if (savedRaw && (ALL as readonly string[]).includes(savedRaw as any)) {
        next = savedRaw as Palette
      }
      if (next) {
        // Keep cookie in sync if differs
        if (next !== palette) setPalette(next)
        else {
          try { document.cookie = `palette=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax` } catch {}
        }
      } else {
        // Ensure classes applied even if staying on current
        const el = document.documentElement
        ;[...ALL, ...LEGACY].forEach((c) => el.classList.remove(c))
        el.classList.add(palette)
        // Persist current to storage
        window.localStorage.setItem(PALETTE_KEY, palette)
        try { document.cookie = `palette=${encodeURIComponent(palette)}; path=/; max-age=31536000; samesite=lax` } catch {}
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // ensure class applied on mount and clean legacy classes
    const el = document.documentElement
    ;[...ALL, ...LEGACY].forEach((c) => el.classList.remove(c))
    el.classList.add(palette)
  }, [palette])

  const value = React.useMemo(() => ({ palette, setPalette }), [palette, setPalette])
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}
