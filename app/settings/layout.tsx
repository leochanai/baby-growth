import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cookies } from "next/headers"
import { dictionaries } from "@/locales"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const lang = cookies().get("lang")?.value === "zh-CN" ? "zh-CN" : "en"
  const t = (key: string) => {
    const dict = dictionaries[lang] ?? dictionaries["en"]
    return key.split('.').reduce((a: any, k) => (a ? a[k] : undefined), dict) ?? key
  }
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={t("common.settings")} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
