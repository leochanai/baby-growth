import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import { WhoDataTable } from "@/components/who-data-table"
import { SiteHeader } from "@/components/site-header"

export default async function WHOPage() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) redirect("/login")

  // Guard against stale Prisma Client in dev where new model may not be loaded yet
  const anyPrisma: any = prisma
  const whoItems = (await (anyPrisma.whoData?.findMany({
    orderBy: [{ gender: "asc" }, { monthAge: "asc" }],
    select: { id: true, gender: true, monthAge: true, heightMedianCm: true, weightMedianKg: true },
  }) ?? Promise.resolve([]))) as { id: number; gender: "male" | "female"; monthAge: number; heightMedianCm: number; weightMedianKg: number }[]

  return (
    <>
      <SiteHeader titleKey="nav.who" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col">
          <div className="content-x content-y stack-y flex flex-col">
            <WhoDataTable initial={whoItems} />
          </div>
        </div>
      </div>
    </>
  )
}
