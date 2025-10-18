"use client"

import * as React from "react"
import { z } from "zod"
import { useI18n } from "@/components/i18n-provider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  babyId: z.coerce.number().int().positive(),
  monthAge: z.coerce.number().int().min(0).max(240),
  heightCm: z.coerce.number().positive(),
  weightKg: z.coerce.number().positive(),
})

export type BabyOption = { id: number; name: string }
export type BabyDataFormValue = z.infer<typeof formSchema>

export function BabyDataForm({
  babies,
  initial,
  onSubmit,
  submitting,
  formId,
  renderSubmit = true,
}: {
  babies: BabyOption[]
  initial?: Partial<BabyDataFormValue>
  submitting?: boolean
  formId?: string
  renderSubmit?: boolean
  onSubmit: (data: BabyDataFormValue) => void
}) {
  const { t } = useI18n()
  const hasBabies = babies.length > 0
  const [form, setForm] = React.useState<BabyDataFormValue>({
    babyId: initial?.babyId ?? (babies[0]?.id ?? 0),
    monthAge: initial?.monthAge ?? 0,
    heightCm: initial?.heightCm ?? 50,
    weightKg: initial?.weightKg ?? 3,
  })
  const [error, setError] = React.useState<string | null>(null)

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!hasBabies) {
          setError(t("babyData.form.invalid"))
          return
        }
        const parsed = formSchema.safeParse(form)
        if (!parsed.success) {
          setError(t("babyData.form.invalid"))
          return
        }
        onSubmit(parsed.data)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="data-baby">{t("babyData.fields.baby")}</Label>
        <Select
          defaultValue={hasBabies ? `${form.babyId}` : undefined}
          onValueChange={(v) => setForm({ ...form, babyId: Number(v) })}
        >
          <SelectTrigger id="data-baby" className="w-full" disabled={!hasBabies}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {babies.map((b) => (
              <SelectItem key={b.id} value={`${b.id}`}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="data-monthAge">{t("babyData.fields.monthAge")}</Label>
        <Input
          id="data-monthAge"
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
        <Label htmlFor="data-height">{t("babyData.fields.heightCm")}</Label>
        <Input
          id="data-height"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          value={form.heightCm}
          onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="data-weight">{t("babyData.fields.weightKg")}</Label>
        <Input
          id="data-weight"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          value={form.weightKg}
          onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
          required
        />
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      {renderSubmit && (
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting || !hasBabies}>
            {submitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      )}
    </form>
  )
}
