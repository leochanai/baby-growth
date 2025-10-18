"use client"

import * as React from "react"
import { z } from "zod"
import { useI18n } from "@/components/i18n-provider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  gender: z.enum(["male", "female"]),
  monthAge: z.coerce.number().int().min(0).max(240),
  heightMedianCm: z.coerce.number().positive(),
  weightMedianKg: z.coerce.number().positive(),
})

export type WhoDataFormValue = z.infer<typeof formSchema>

export function WhoDataForm({
  initial,
  submitting,
  formId,
  renderSubmit = true,
  onSubmit,
}: {
  initial?: Partial<WhoDataFormValue>
  submitting?: boolean
  formId?: string
  renderSubmit?: boolean
  onSubmit: (data: WhoDataFormValue) => void
}) {
  const { t } = useI18n()
  const [form, setForm] = React.useState<WhoDataFormValue>({
    gender: initial?.gender ?? "male",
    monthAge: initial?.monthAge ?? 0,
    heightMedianCm: initial?.heightMedianCm ?? 50,
    weightMedianKg: initial?.weightMedianKg ?? 3,
  })
  const [error, setError] = React.useState<string | null>(null)

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const parsed = formSchema.safeParse(form)
        if (!parsed.success) {
          setError(t("whoData.form.invalid"))
          return
        }
        onSubmit(parsed.data)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="who-gender">{t("whoData.fields.gender")}</Label>
        <Select
          defaultValue={form.gender}
          onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
        >
          <SelectTrigger id="who-gender" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{t("charts.filters.boys")}</SelectItem>
            <SelectItem value="female">{t("charts.filters.girls")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="who-monthAge">{t("whoData.fields.monthAge")}</Label>
        <Input
          id="who-monthAge"
          type="number"
          inputMode="numeric"
          min={0}
          max={240}
          value={form.monthAge}
          onChange={(e) => setForm({ ...form, monthAge: Number(e.target.value) })}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="who-height">{t("whoData.fields.heightMedianCm")}</Label>
        <Input
          id="who-height"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          value={form.heightMedianCm}
          onChange={(e) => setForm({ ...form, heightMedianCm: Number(e.target.value) })}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="who-weight">{t("whoData.fields.weightMedianKg")}</Label>
        <Input
          id="who-weight"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          value={form.weightMedianKg}
          onChange={(e) => setForm({ ...form, weightMedianKg: Number(e.target.value) })}
          required
        />
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      {renderSubmit && (
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      )}
    </form>
  )
}

