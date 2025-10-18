"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// no resize controls needed
import { useI18n } from "@/components/i18n-provider"

type Props = {
  src: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onCancel: () => void
  onSave: (blob: Blob) => void
  outputSize?: number // square pixels, default 512
}

export function AvatarCropper({ src, open, onOpenChange, onCancel, onSave, outputSize = 512 }: Props) {
  const { t } = useI18n()
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null)
  const [fitScale, setFitScale] = React.useState(1)
  const [display, setDisplay] = React.useState<{ w: number; h: number; left: number; top: number }>({ w: 0, h: 0, left: 0, top: 0 })
  const [sel, setSel] = React.useState<{ x: number; y: number; size: number }>({ x: 0, y: 0, size: 0 })
  const [dragging, setDragging] = React.useState(false)
  const [start, setStart] = React.useState<{ x: number; y: number } | null>(null)

  const viewSize = 520 // stage square in px
  const stagePaddingX = 120
  const stagePaddingY = 80

  React.useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      setNatural({ w, h })
      const scale = Math.min(viewSize / w, viewSize / h) // contain
      setFitScale(scale)
      const dw = w * scale
      const dh = h * scale
      // image box centered inside stage, which includes paddings
      const left = stagePaddingX + (viewSize - dw) / 2
      const top = stagePaddingY + (viewSize - dh) / 2
      setDisplay({ w: dw, h: dh, left, top })
      const border = 4 // account for 2px border on each side when clamping visually
      const initSize = Math.max(32, Math.min(dw, dh) - border)
      setSel({ x: left + (dw - initSize) / 2, y: top + (dh - initSize) / 2, size: initSize })
    }
    img.src = src
  }, [src])

  function clampSel(nx: number, ny: number, size: number) {
    const minX = display.left
    const minY = display.top
    const maxX = display.left + display.w - size
    const maxY = display.top + display.h - size
    return { x: Math.min(Math.max(nx, minX), Math.max(minX, maxX)), y: Math.min(Math.max(ny, minY), Math.max(minY, maxY)) }
  }

  function onSelDown(e: React.PointerEvent) {
    setDragging(true)
    setStart({ x: e.clientX - sel.x, y: e.clientY - sel.y })
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  function onSelMove(e: React.PointerEvent) {
    if (!dragging || !start) return
    const nx = e.clientX - start.x
    const ny = e.clientY - start.y
    const cl = clampSel(nx, ny, sel.size)
    setSel((s) => ({ ...s, x: cl.x, y: cl.y }))
  }
  function onSelUp(e: React.PointerEvent) {
    setDragging(false)
    setStart(null)
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch {}
  }

  // no resizing; selection size is fixed at init (max square)

  async function handleSave() {
    if (!natural) return
    // map selection to original pixels via fitScale and display offsets
    const sx = Math.max(0, (sel.x - display.left) / fitScale)
    const sy = Math.max(0, (sel.y - display.top) / fitScale)
    const sw = sel.size / fitScale
    const sh = sel.size / fitScale
    const canvas = document.createElement("canvas")
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(imgRef.current!, sx, sy, sw, sh, 0, 0, outputSize, outputSize)
    // export as JPEG to reduce size
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92))
    onSave(blob)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : onCancel())}>
      <DialogContent className="gap-0 max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{t("avatarCrop.title")}</DialogTitle>
          <DialogDescription>{t("avatarCrop.description")}</DialogDescription>
        </DialogHeader>
        <div className="content-x pb-4">
          {/* Stage: image fully visible (contain); selection square moves on top */}
          <div
            className="relative mx-auto select-none touch-none rounded-xl bg-neutral-200/40 dark:bg-neutral-700/30"
            style={{ width: viewSize + stagePaddingX * 2, height: viewSize + stagePaddingY * 2 }}
          >
            {/* image */}
            {natural && (
            <img
              ref={imgRef}
              src={src}
              alt="avatar"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ width: display.w, height: display.h }}
              draggable={false}
            />)}
            {/* movable selection with outside dim */}
            {natural && (
            <div
              role="button"
              aria-label="selection"
              onPointerDown={onSelDown}
              onPointerMove={onSelMove}
              onPointerUp={onSelUp}
              className="absolute rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] cursor-grab active:cursor-grabbing"
              style={{ left: sel.x, top: sel.y, width: sel.size, height: sel.size }}
            />)}
          </div>

          {/* No size controls as requested */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t("avatarCrop.cancel")}</Button>
          <Button onClick={handleSave}>{t("avatarCrop.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
