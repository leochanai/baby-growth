"use client"

import * as React from "react"
import { IconDotsVertical, IconPencil, IconPlus, IconTrash, IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight } from "@tabler/icons-react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  React.useEffect(() => {
    // clamp page when data or page size changes
    setPageIndex((i) => Math.min(i, pageCount - 1))
  }, [rows.length, pageSize])

  const pageRows = React.useMemo(() => {
    const start = pageIndex * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, pageIndex, pageSize])

  function calcMonthAgeParts(birthISO: string, now = new Date()) {
    const b = new Date(birthISO)
    // Normalize to date (ignore time zone drift by using Y-M-D constructor)
    const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate())
    const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (isNaN(b0.getTime())) return { m: 0, d: 0 }
    // months difference
    let m = (n0.getFullYear() - b0.getFullYear()) * 12 + (n0.getMonth() - b0.getMonth())
    let anchor = new Date(b0.getFullYear(), b0.getMonth() + m, b0.getDate())
    if (anchor.getTime() > n0.getTime()) {
      m -= 1
      anchor = new Date(b0.getFullYear(), b0.getMonth() + m, b0.getDate())
    }
    const msPerDay = 24 * 60 * 60 * 1000
    const d = Math.max(0, Math.floor((n0.getTime() - anchor.getTime()) / msPerDay))
    return { m: Math.max(0, m), d }
  }

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
      <div className="content-x flex items-center justify-between py-2">
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
            <div className="content-x pb-5">
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
      <div className="content-x">
        <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[35%]">{t("babies.fields.name")}</TableHead>
              <TableHead className="w-[15%]">{t("babies.fields.gender")}</TableHead>
              <TableHead className="w-[20%]">{t("babies.fields.birthDate")}</TableHead>
              <TableHead className="w-[15%]">{t("babies.fields.monthAge")}</TableHead>
              <TableHead className="w-[15%] text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.gender === "MALE" ? t("babies.gender.male") : t("babies.gender.female")}</TableCell>
                <TableCell>{new Date(b.birthDate).toISOString().slice(0, 10)}</TableCell>
                <TableCell>
                  {(() => {
                    const { m, d } = calcMonthAgeParts(b.birthDate)
                    const monthLabel = t("charts.units.month")
                    const dayLabel = t("charts.units.day")
                    return (
                      <span className="font-mono tabular-nums">{m}{monthLabel}{d > 0 ? ` ${d}${dayLabel}` : ""}</span>
                    )
                  })()}
                </TableCell>
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("babies.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination toolbar */}
      <div className="content-x flex items-center justify-between py-2">
        <div className="hidden flex-1 lg:block" />
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              {t("common.rowsPerPage")}
            </Label>
            <Select value={`${pageSize}`} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((ps) => (
                  <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {t("common.paginationPageOf", { x: pageIndex + 1, y: pageCount })}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={pageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("babies.edit")}</DialogTitle>
            <DialogDescription>{t("babies.editDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="content-x pb-5">
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
