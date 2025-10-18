"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/components/i18n-provider"

export function AccountSecurityForm() {
  const { t } = useI18n()
  const [currentPassword, setCurrent] = useState("")
  const [newPassword, setNew] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (newPassword !== confirm) {
      setError(t("accountPage.securityForm.mismatch"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || t("accountPage.securityForm.changeFailed"))
      setMessage(t("accountPage.securityForm.updated"))
      setCurrent("")
      setNew("")
      setConfirm("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("accountPage.securityForm.changeFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current">{t("accountPage.securityForm.current")}</FieldLabel>
          <Input
            id="current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new">{t("accountPage.securityForm.new")}</FieldLabel>
          <Input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
          />
          <FieldDescription>{t("accountPage.securityForm.atLeast8")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">{t("accountPage.securityForm.confirm")}</FieldLabel>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? t("accountPage.securityForm.updating") : t("accountPage.securityForm.updatePassword")}
          </Button>
          {message && (
            <FieldDescription className="text-green-600 dark:text-green-500">
              {message}
            </FieldDescription>
          )}
          {error && (
            <FieldDescription className="text-destructive">{error}</FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}
