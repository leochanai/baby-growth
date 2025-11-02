import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import { BabiesTable } from "@/components/babies-table"

export default async function BabiesPage() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) redirect("/login")
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) redirect("/login")
  const babies = await prisma.baby.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, gender: true, birthDate: true },
  })
  const initial = babies.map((b) => ({ ...b, birthDate: b.birthDate.toISOString(), gender: b.gender as "MALE" | "FEMALE" }))
  return (
    <div className="content-x content-y">
      <BabiesTable initial={initial} />
    </div>
  )
}
