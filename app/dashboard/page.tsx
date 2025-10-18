import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// no table data (table removed)

export default async function Page() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) redirect("/login")
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) redirect("/login")

  const anyPrisma: any = prisma
  const babies = (await (anyPrisma.baby?.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, gender: true, birthDate: true },
  }) ?? Promise.resolve([]))) as { id: number; name: string; gender: string; birthDate: Date }[]
  const data = (await (anyPrisma.babyData?.findMany({
    where: { baby: { userId: user.id } },
    orderBy: { monthAge: "asc" },
    select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true },
  }) ?? Promise.resolve([]))) as { id: number; babyId: number; monthAge: number; heightCm: number; weightKg: number }[]
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader titleKey="nav.dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <div className="content-y stack-y flex flex-1 flex-col">
              <div className="content-x flex-1">
                <ChartAreaInteractive babies={babies} data={data} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
