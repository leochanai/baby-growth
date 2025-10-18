"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { useI18n } from "@/components/i18n-provider"

export function AccountDangerZone() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) throw new Error("delete_failed")
      // End session and go to signup
      await signOut({ callbackUrl: "/signup" })
    } catch (e) {
      // fallback: stay but close dialog
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <div className="text-muted-foreground text-sm">{t("accountDanger.desc")}</div>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        {t("accountDanger.deleteBtn")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accountDanger.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("accountDanger.confirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("avatarCrop.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t("accountDanger.deleting") : t("accountDanger.confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
