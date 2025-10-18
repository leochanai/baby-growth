import { GalleryVerticalEnd } from "lucide-react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { dictionaries } from "@/locales"
import Link from "next/link"

import { LoginForm } from "@/components/login-form"

export async function generateMetadata(): Promise<Metadata> {
  const lang = cookies().get("lang")?.value === "zh-CN" ? "zh-CN" : "en"
  const dict = dictionaries[lang] ?? dictionaries["en"]
  const app = dict.common.appName
  return {
    title: `Sign in | ${app}`,
    description: `Sign in to your ${app} account.`,
  }
}

export default function LoginPage() {
  const lang = cookies().get("lang")?.value === "zh-CN" ? "zh-CN" : "en"
  const dict = dictionaries[lang] ?? dictionaries["en"]
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {dict.common.appName}
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
