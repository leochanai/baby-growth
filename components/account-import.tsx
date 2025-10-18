"use client"

import * as React from "react"
import { IconUpload } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/components/i18n-provider"

export function AccountImport() {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"append" | "replace">("append")
  const [file, setFile] = React.useState<File | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [doneOpen, setDoneOpen] = React.useState(false)
  const [stats, setStats] = React.useState<any | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function onSubmit() {
    if (!file) { setError(t("import.errors.noFile")); return }
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set("mode", mode)
      fd.set("file", file)
      const res = await fetch("/api/import/all", { method: "POST", body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        setError(j?.error || t("import.errors.failed"))
        return
      }
      const j = await res.json().catch(() => ({ ok: true })) as any
      setOpen(false)
      setStats(j?.stats ?? null)
      setDoneOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setFile(null); setError(null); setMode("append") } }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconUpload /> {t("import.open")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.desc")}</DialogDescription>
        </DialogHeader>
        <div className="content-x content-y flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="import-file">{t("import.file")}</Label>
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".zip"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <IconUpload /> {t("import.chooseFile")}
              </Button>
              <div className="text-sm text-muted-foreground truncate">
                {file ? file.name : t("import.noFile")}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="import-mode">{t("import.mode")}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger id="import-mode" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="append">{t("import.modes.append")}</SelectItem>
                <SelectItem value="replace">{t("import.modes.replace")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={submitting || !file}>
            {submitting ? t("common.saving") : t("import.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={doneOpen} onOpenChange={setDoneOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("import.success.title")}</DialogTitle>
          <DialogDescription>
            {stats
              ? t("import.success.desc", {
                  mode: t(stats.mode === "replace" ? "import.modes.replace" : "import.modes.append"),
                  bCreated: stats.babies?.created ?? 0,
                  bRemoved: stats.babies?.removed ?? 0,
                  dCreated: stats.data?.created ?? 0,
                  dUpdated: stats.data?.updated ?? 0,
                  dSkipped: stats.data?.skipped ?? 0,
                })
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>{t("common.ok")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
