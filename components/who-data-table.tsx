"use client"

import * as React from "react"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDotsVertical, IconPencil } from "@tabler/icons-react"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WhoDataForm, type WhoDataFormValue } from "@/components/who-data-form"

export type WhoDataRow = {
  id: number
  gender: "male" | "female"
  monthAge: number
  heightMedianCm: number
  weightMedianKg: number
}

export function WhoDataTable({ initial }: { initial: WhoDataRow[] }) {
  const { t } = useI18n()
  const [rows, setRows] = React.useState<WhoDataRow[]>([...initial].sort((a, b) => a.monthAge - b.monthAge))
  const [editing, setEditing] = React.useState<WhoDataRow | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [filterGender, setFilterGender] = React.useState<string>("all")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const filteredRows = React.useMemo(() => {
    if (filterGender === "all") return rows
    return rows.filter((r) => r.gender === filterGender)
  }, [rows, filterGender])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  React.useEffect(() => {
    setPageIndex((i) => Math.min(i, pageCount - 1))
  }, [filteredRows.length, pageSize])
  React.useEffect(() => {
    setPageIndex(0)
  }, [filterGender])

  const pageRows = React.useMemo(() => {
    const start = pageIndex * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, pageIndex, pageSize])

  async function updateOne(id: number, values: WhoDataFormValue) {
    const res = await fetch(`/api/who-data/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any))
      setEditError(j?.error || t("whoData.errors.updateFailed"))
      return
    }
    const updated = (await res.json()) as WhoDataRow
    setRows((r) => r.map((x) => (x.id === id ? updated : x)).sort((a, b) => a.monthAge - b.monthAge))
    setEditing(null)
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="content-x flex items-center justify-end py-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="gender-filter" className="text-sm font-medium">
            {t("whoData.filter.gender")}
          </Label>
          <Select value={filterGender} onValueChange={(v) => setFilterGender(v)}>
            <SelectTrigger id="gender-filter" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="all">{t("whoData.filter.all")}</SelectItem>
              <SelectItem value="male">{t("charts.filters.boys")}</SelectItem>
              <SelectItem value="female">{t("charts.filters.girls")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="content-x pb-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[20%]">{t("babies.fields.gender")}</TableHead>
                <TableHead className="w-[20%]">{t("babyData.fields.monthAge")}</TableHead>
                <TableHead className="w-[30%]">{t("babyData.fields.heightCm")}</TableHead>
                <TableHead className="w-[30%]">{t("babyData.fields.weightKg")}</TableHead>
                <TableHead className="w-[10%] text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.gender === "male" ? t("charts.filters.boys") : t("charts.filters.girls")}</TableCell>
                  <TableCell>{r.monthAge}</TableCell>
                  <TableCell>{r.heightMedianCm.toFixed(1)}</TableCell>
                  <TableCell>{r.weightMedianKg.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8">
                          <IconDotsVertical />
                          <span className="sr-only">{t("common.openMenu")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => setEditing(r)}>
                          <IconPencil /> {t("common.edit")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("whoData.empty")}
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
            <DialogTitle>{t("whoData.edit")}</DialogTitle>
            <DialogDescription>{t("whoData.editDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="content-x pb-5">
                <WhoDataForm
                  formId="who-data-edit"
                  renderSubmit={false}
                  initial={{
                    gender: editing.gender,
                    monthAge: editing.monthAge,
                    heightMedianCm: editing.heightMedianCm,
                    weightMedianKg: editing.weightMedianKg,
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
                <Button type="submit" form="who-data-edit">
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
