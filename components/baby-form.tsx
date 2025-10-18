"use client"

import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDownIcon, CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().trim().min(1).max(50),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().min(1), // YYYY-MM-DD
})

export type BabyFormValue = z.infer<typeof formSchema>

export function BabyForm({
  initial,
  onSubmit,
  submitting,
  formId,
  renderSubmit = true,
}: {
  initial?: Partial<BabyFormValue>
  submitting?: boolean
  formId?: string
  renderSubmit?: boolean
  onSubmit: (data: BabyFormValue) => void
}) {
  const { t } = useI18n()
  const [form, setForm] = React.useState<BabyFormValue>({
    name: initial?.name ?? "",
    gender: (initial?.gender as any) ?? "MALE",
    birthDate: initial?.birthDate ?? "",
  })
  const [error, setError] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const parsed = formSchema.safeParse(form)
        if (!parsed.success) {
          setError(t("babies.form.invalid"))
          return
        }
        onSubmit(parsed.data)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="baby-name">{t("babies.fields.name")}</Label>
        <Input
          id="baby-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("babies.fields.namePlaceholder")}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="baby-gender">{t("babies.fields.gender")}</Label>
        <Select
          defaultValue={form.gender}
          onValueChange={(v) => setForm({ ...form, gender: v as any })}
        >
          <SelectTrigger id="baby-gender" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">{t("babies.gender.male")}</SelectItem>
            <SelectItem value="FEMALE">{t("babies.gender.female")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="baby-birth">
          {t("babies.fields.birthDate")}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="baby-birth"
              className={cn(
                "w-full justify-start text-left font-normal",
                !form.birthDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.birthDate
                ? new Date(form.birthDate).toLocaleDateString()
                : t("common.pickDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={form.birthDate ? new Date(form.birthDate) : undefined}
              captionLayout="dropdown"
              onSelect={(date) => {
                setForm({ ...form, birthDate: date ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
                  .toISOString()
                  .slice(0, 10) : "" })
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
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
