import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = (await getServerSession()) as Session | null
  if (!session?.user) {
    redirect("/login")
  }
  return <>{children}</>
}
