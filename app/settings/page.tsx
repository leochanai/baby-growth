"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { usePalette } from "@/components/palette-provider"
import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/components/i18n-provider"

const palettes = [
  { id: "theme-default", label: "Default" },
  { id: "theme-red", label: "Red" },
  { id: "theme-orange", label: "Orange" },
  { id: "theme-green", label: "Green" },
  { id: "theme-blue", label: "Blue" },
  { id: "theme-yellow", label: "Yellow" },
  { id: "theme-violet", label: "Violet" },
] as const

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { palette, setPalette } = usePalette()
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { t } = useI18n()

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
            <Label htmlFor="theme-mode">{t("settings.themeMode")}</Label>
            {mounted ? (
              <Select value={theme as string} onValueChange={(v) => setTheme(v)}>
                <SelectTrigger id="theme-mode" className="w-[220px]"><SelectValue placeholder={t("settings.selectMode")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.mode.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.mode.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.mode.system")}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-muted/50 h-9 w-[220px] animate-pulse rounded-md" />
            )}
            <div className="text-muted-foreground text-xs">{t("common.current")}: {mounted ? t(`settings.mode.${resolvedTheme as "light" | "dark" | "system"}`) : "–"}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="palette">{t("settings.palette")}</Label>
            {mounted ? (
              <Select value={palette} onValueChange={(v) => setPalette(v as any)}>
                <SelectTrigger id="palette" className="w-[220px]"><SelectValue placeholder={t("settings.selectPalette")} /></SelectTrigger>
                <SelectContent>
                  {palettes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-muted/50 h-9 w-[220px] animate-pulse rounded-md" />
            )}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.language")}</CardTitle>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
            <Label htmlFor="language">{t("settings.languageLabel")}</Label>
            {mounted ? (
              <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                <SelectTrigger id="language" className="w-[220px]"><SelectValue placeholder={t("settings.languageDesc")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("settings.languages.en")}</SelectItem>
                  <SelectItem value="zh-CN">{t("settings.languages.zhCN")}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-muted/50 h-9 w-[220px] animate-pulse rounded-md" />
            )}
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
