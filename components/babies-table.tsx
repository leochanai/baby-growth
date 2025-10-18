"use client"

import * as React from "react"
import { IconDotsVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BabyForm, type BabyFormValue } from "@/components/baby-form"
import { useI18n } from "@/components/i18n-provider"

export type BabyRow = {
  id: number
  name: string
  gender: "MALE" | "FEMALE"
  birthDate: string // ISO string
}

export function BabiesTable({ initial }: { initial: BabyRow[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [rows, setRows] = React.useState<BabyRow[]>(initial)
  const [creating, setCreating] = React.useState(false)
  const [editing, setEditing] = React.useState<BabyRow | null>(null)

  async function createOne(values: BabyFormValue) {
    setCreating(true)
    try {
      const res = await fetch("/api/babies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setRows((r) => [{ ...created, birthDate: created.birthDate }, ...r])
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  async function updateOne(id: number, values: BabyFormValue) {
    const res = await fetch(`/api/babies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) return
    const updated = await res.json()
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...updated, birthDate: updated.birthDate } : x)))
    setEditing(null)
    router.refresh()
  }

  async function deleteOne(id: number) {
    if (!confirm(t("babies.confirmDelete"))) return
    const res = await fetch(`/api/babies/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setRows((r) => r.filter((x) => x.id !== id))
    router.refresh()
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 py-2 lg:px-6">
        <div className="text-sm text-muted-foreground">{t("babies.count", { n: rows.length })}</div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus />
              {t("babies.add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("babies.add")}</DialogTitle>
              <DialogDescription>{t("babies.addDesc")}</DialogDescription>
            </DialogHeader>
            <div className="px-5 pb-5">
              <BabyForm formId="baby-create-form" renderSubmit={false} submitting={creating} onSubmit={(v) => createOne(v)} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" form="baby-create-form" disabled={creating}>
                {creating ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="px-4 lg:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{t("babies.fields.name")}</TableHead>
              <TableHead className="w-[20%]">{t("babies.fields.gender")}</TableHead>
              <TableHead className="w-[25%]">{t("babies.fields.birthDate")}</TableHead>
              <TableHead className="w-[15%] text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.gender === "MALE" ? t("babies.gender.male") : t("babies.gender.female")}</TableCell>
                <TableCell>{new Date(b.birthDate).toISOString().slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8">
                        <IconDotsVertical />
                        <span className="sr-only">{t("common.openMenu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setEditing(b)}>
                        <IconPencil /> {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => deleteOne(b.id)}>
                        <IconTrash /> {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t("babies.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("babies.edit")}</DialogTitle>
            <DialogDescription>{t("babies.editDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="px-5 pb-5">
                <BabyForm
                  formId="baby-edit-form"
                  renderSubmit={false}
                  initial={{
                    name: editing.name,
                    gender: editing.gender,
                    birthDate: editing.birthDate.slice(0, 10),
                  }}
                  onSubmit={(v) => updateOne(editing.id, v)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button type="submit" form="baby-edit-form">
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
