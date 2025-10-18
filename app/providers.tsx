"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { PaletteProvider } from "@/components/palette-provider"
import { LanguageProvider, type Language } from "@/components/language-provider"
import { I18nProvider } from "@/components/i18n-provider"
import type { MessageSchema } from "@/locales"

export function Providers({ children, initialPalette, initialLanguage = "en", initialMessages }: { children: React.ReactNode, initialPalette: string, initialLanguage?: Language, initialMessages: MessageSchema }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LanguageProvider initialLanguage={initialLanguage}>
        <I18nProvider initialMessages={initialMessages}>
          <PaletteProvider initialPalette={initialPalette as any}>
            <SessionProvider>{children}</SessionProvider>
          </PaletteProvider>
        </I18nProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
