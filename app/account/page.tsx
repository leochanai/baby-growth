import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AccountProfileForm } from "@/components/account-profile-form"
import { AccountSecurityForm } from "@/components/account-security-form"
import { cookies } from "next/headers"
import { dictionaries } from "@/locales"
import { AccountDangerZone } from "@/components/account-danger-zone"
import { useI18n } from "@/components/i18n-provider"

export default async function AccountPage() {
  const session = (await getServerSession()) as Session | null
  if (!session?.user?.email) redirect("/login")

  const lang = cookies().get("lang")?.value === "zh-CN" ? "zh-CN" : "en"
  const dict = dictionaries[lang] ?? dictionaries["en"]
  return (
    <div className="content-x content-y">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{dict.accountPage.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountProfileForm
              defaultName={session.user.name ?? ""}
              defaultImage={session.user.image ?? null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.accountPage.security}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountSecurityForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.accountPage.dataPrivacy}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <a href="/api/export/all">{dict.accountPage.exportAll}</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.accountDanger.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountDangerZone />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
