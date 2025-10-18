"use client"

// import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
// Quick appearance toggles are removed; use /settings instead.

import { useI18n } from "@/components/i18n-provider"

export function SiteHeader({ title, titleKey }: { title?: string; titleKey?: string }) {
  const { t } = useI18n()
  const resolved = title ?? (titleKey ? t(titleKey) : t("nav.dashboard"))
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{resolved}</h1>
        <div className="ml-auto flex items-center gap-2" />
      </div>
    </header>
  )
}
