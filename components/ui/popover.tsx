"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type Ctx = {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const PopoverContext = React.createContext<Ctx | null>(null)

export function Popover({ open: openProp, onOpenChange, children }: { open?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode }) {
  const [internal, setInternal] = React.useState(false)
  const open = openProp ?? internal
  const setOpen = React.useCallback((v: boolean) => {
    onOpenChange ? onOpenChange(v) : setInternal(v)
  }, [onOpenChange])
  const triggerRef = React.useRef<HTMLElement>(null)
  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open, setOpen])
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
}

export function PopoverTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(PopoverContext)!
  const child = React.Children.only(children)
  const props = {
    ref: ctx.triggerRef as any,
    onClick: (e: any) => {
      child.props.onClick?.(e)
      ctx.setOpen(!ctx.open)
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': ctx.open,
  }
  return asChild ? React.cloneElement(child, props) : React.createElement('button', props, child)
}

export function PopoverContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(PopoverContext)!
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

  React.useEffect(() => {
    if (!ctx.open) return
    const el = ctx.triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width })
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (el.contains(target)) return
      ctx.setOpen(false)
    }
    window.addEventListener('resize', () => ctx.setOpen(false), { once: true })
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [ctx.open])

  if (!ctx.open) return null
  return createPortal(
    <div
      className={cn("z-50 rounded-md border bg-popover text-popover-foreground shadow-md", className)}
      style={{ position: 'absolute', top: pos.top, left: pos.left, minWidth: pos.width }}
      role="dialog"
    >
      {children}
    </div>,
    document.body
  )
}

