import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cookies } from "next/headers"
import { dictionaries } from "@/locales"

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user) redirect("/login")

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={(cookies().get("lang")?.value === "zh-CN" ? dictionaries["zh-CN"] : dictionaries["en"]).common.account} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
