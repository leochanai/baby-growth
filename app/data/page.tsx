import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import { BabyDataTable } from "@/components/baby-data-table"
import { SiteHeader } from "@/components/site-header"

export default async function DataPage() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) redirect("/login")
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) redirect("/login")

  // Guard against stale Prisma Client in dev where new model may not be loaded yet
  const anyPrisma: any = prisma
  const babies = (await (anyPrisma.baby?.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  }) ?? Promise.resolve([]))) as { id: number; name: string }[]
  const data = (await (anyPrisma.babyData?.findMany({
    where: { baby: { userId: user.id } },
    orderBy: { monthAge: "desc" },
    select: { id: true, babyId: true, monthAge: true, heightCm: true, weightKg: true },
  }) ?? Promise.resolve([]))) as { id: number; babyId: number; monthAge: number; heightCm: number; weightKg: number }[]

  return (
    <>
      <SiteHeader titleKey="nav.analytics" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col">
          <div className="content-x content-y stack-y flex flex-col">
            <BabyDataTable initial={data} babies={babies} />
          </div>
        </div>
      </div>
    </>
  )
}
