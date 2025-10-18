"use client"

import * as React from "react"
import { dictionaries, type MessageSchema } from "@/locales"
import { useLanguage } from "@/components/language-provider"

type Ctx = {
  t: (key: string, params?: Record<string, string | number>) => string
  messages: MessageSchema
}

const I18nContext = React.createContext<Ctx | null>(null)

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj)
}

function format(str: string, params?: Record<string, string | number>) {
  if (!params) return str
  return Object.keys(params).reduce(
    (s, k) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(params[k])),
    str
  )
}

export function I18nProvider({
  children,
  initialMessages,
}: {
  children: React.ReactNode
  initialMessages: MessageSchema
}) {
  const { language } = useLanguage()
  const [messages, setMessages] = React.useState<MessageSchema>(initialMessages)

  React.useEffect(() => {
    const dict = dictionaries[language] ?? dictionaries["en"]
    setMessages(dict)
  }, [language])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const val = get(messages, key)
      if (!val) return key
      if (typeof val === "string") return format(val, params)
      return String(val)
    },
    [messages]
  )

  const value = React.useMemo(() => ({ t, messages }), [t, messages])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}

