"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDotsVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useI18n } from "@/components/i18n-provider"
import { BabyDataForm, type BabyDataFormValue, type BabyOption } from "@/components/baby-data-form"

export type BabyDataRow = {
  id: number
  babyId: number
  monthAge: number
  heightCm: number
  weightKg: number
}

export function BabyDataTable({ initial, babies }: { initial: BabyDataRow[]; babies: BabyOption[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = React.useState<BabyDataRow[]>([...initial].sort((a, b) => b.monthAge - a.monthAge))
  const [creating, setCreating] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<BabyDataRow | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [filterBaby, setFilterBaby] = React.useState<string>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const babyMap = React.useMemo(() => new Map(babies.map((b) => [b.id, b.name])), [babies])
  const filteredRows = React.useMemo(() => {
    if (filterBaby === "all") return rows
    const bid = Number(filterBaby)
    return rows.filter((r) => r.babyId === bid)
  }, [rows, filterBaby])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  React.useEffect(() => {
    setPageIndex((i) => Math.min(i, pageCount - 1))
  }, [filteredRows.length, pageSize])
  React.useEffect(() => {
    setPageIndex(0)
  }, [filterBaby])

  const pageRows = React.useMemo(() => {
    const start = pageIndex * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, pageIndex, pageSize])

  // Open create dialog when arriving with ?quickAdd=1
  React.useEffect(() => {
    const q = searchParams?.get("quickAdd")
    if (q) {
      setCreateOpen(true)
      // strip query so refresh/back doesn't keep reopening
      router.replace("/data")
    }
  }, [searchParams])

  async function createOne(values: BabyDataFormValue) {
    setCreating(true)
    try {
      const res = await fetch("/api/baby-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        setCreateError(j?.error === 'Duplicate monthAge for this baby' ? t('babyData.errors.duplicate') : (j?.error || t('babyData.errors.createFailed')))
        return
      }
      const created = (await res.json()) as BabyDataRow
      setRows((r) => [...r, created].sort((a, b) => b.monthAge - a.monthAge))
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  async function updateOne(id: number, values: BabyDataFormValue) {
    const res = await fetch(`/api/baby-data/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any))
      setEditError(j?.error === 'Duplicate monthAge for this baby' ? t('babyData.errors.duplicate') : (j?.error || t('babyData.errors.updateFailed')))
      return
    }
    const updated = (await res.json()) as BabyDataRow
    setRows((r) => r.map((x) => (x.id === id ? updated : x)).sort((a, b) => b.monthAge - a.monthAge))
    setEditing(null)
    router.refresh()
  }

  async function deleteOne(id: number) {
    if (!confirm(t("babies.confirmDelete"))) return
    const res = await fetch(`/api/baby-data/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setRows((r) => r.filter((x) => x.id !== id))
    router.refresh()
  }

  return (
    <div className="w-full">
      <div className="content-x flex items-center justify-between py-2">
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setCreateError(null) }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus />
              {t("babyData.add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("babyData.add")}</DialogTitle>
              <DialogDescription>{t("babyData.addDesc")}</DialogDescription>
            </DialogHeader>
            <div className="content-x pb-5">
              <BabyDataForm babies={babies} formId="baby-data-create" renderSubmit={false} submitting={creating} onSubmit={(v) => createOne(v)} />
            </div>
            {createError && (
              <div className="content-x -mt-2 pb-2 text-sm text-destructive">{createError}</div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" form="baby-data-create" disabled={creating}>
                {creating ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex items-center gap-2">
          <Select value={filterBaby} onValueChange={(v) => setFilterBaby(v)}>
            <SelectTrigger id="baby-filter" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("babyData.filter.all")}</SelectItem>
              {babies.map((b) => (
                <SelectItem key={b.id} value={`${b.id}`}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="content-x">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[30%]">{t("babyData.fields.baby")}</TableHead>
                <TableHead className="w-[20%]">{t("babyData.fields.monthAge")}</TableHead>
                <TableHead className="w-[25%]">{t("babyData.fields.heightCm")}</TableHead>
                <TableHead className="w-[25%]">{t("babyData.fields.weightKg")}</TableHead>
                <TableHead className="w-[10%] text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{babyMap.get(r.babyId) ?? r.babyId}</TableCell>
                  <TableCell>{r.monthAge}</TableCell>
                  <TableCell>{r.heightCm.toFixed(1)}</TableCell>
                  <TableCell>{r.weightKg.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8">
                          <IconDotsVertical />
                          <span className="sr-only">{t("common.openMenu")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => setEditing(r)}>
                          <IconPencil /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => deleteOne(r.id)}>
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
                    {t("babyData.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
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
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={pageIndex === 0}>
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))} disabled={pageIndex >= pageCount - 1}>
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}>
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) { setEditing(null); setEditError(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("babyData.edit")}</DialogTitle>
            <DialogDescription>{t("babyData.editDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="content-x pb-5">
                <BabyDataForm
                  babies={babies}
                  formId="baby-data-edit"
                  renderSubmit={false}
                  initial={{
                    babyId: editing.babyId,
                    monthAge: editing.monthAge,
                    heightCm: editing.heightCm,
                    weightKg: editing.weightKg,
                  }}
                  onSubmit={(v) => updateOne(editing.id, v)}
                />
              </div>
              {editError && (
                <div className="content-x -mt-2 pb-2 text-sm text-destructive">{editError}</div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button type="submit" form="baby-data-edit">
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
