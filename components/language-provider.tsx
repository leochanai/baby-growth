"use client"

import * as React from "react"

export type Language = "en" | "zh-CN"

type Ctx = { language: Language; setLanguage: (l: Language) => void }
const LanguageContext = React.createContext<Ctx | null>(null)

const LANG_KEY = "lang"
const ALLOWED: readonly Language[] = ["en", "zh-CN"] as const

export function useLanguage() {
  const ctx = React.useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode
  initialLanguage?: Language
}) {
  const [language, setLanguageState] = React.useState<Language>(initialLanguage)

  const setLanguage = React.useCallback((l: Language) => {
    if (!ALLOWED.includes(l)) return
    setLanguageState(l)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANG_KEY, l)
      } catch {}
      try {
        document.cookie = `lang=${encodeURIComponent(l)}; path=/; max-age=31536000; samesite=lax`
      } catch {}
      try {
        document.documentElement.setAttribute("lang", l)
      } catch {}
    }
  }, [])

  React.useEffect(() => {
    // Ensure attribute and storage are in sync on mount
    try {
      document.documentElement.setAttribute("lang", language)
      const saved = window.localStorage.getItem(LANG_KEY)
      if (saved && ALLOWED.includes(saved as Language) && saved !== language) {
        setLanguage(saved as Language)
      } else if (!saved) {
        window.localStorage.setItem(LANG_KEY, language)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = React.useMemo(() => ({ language, setLanguage }), [language, setLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

