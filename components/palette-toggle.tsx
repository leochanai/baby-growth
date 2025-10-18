"use client"

import { usePalette } from "@/components/palette-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const items = [
  { id: "theme-default", label: "Default" },
  { id: "theme-red", label: "Red" },
  { id: "theme-orange", label: "Orange" },
  { id: "theme-green", label: "Green" },
  { id: "theme-blue", label: "Blue" },
  { id: "theme-yellow", label: "Yellow" },
  { id: "theme-violet", label: "Violet" },
] as const

export function PaletteToggle() {
  const { palette, setPalette } = usePalette()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Select color palette">
          {items.find((i) => i.id === palette)?.label ?? "Palette"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((i) => (
          <DropdownMenuItem key={i.id} onClick={() => setPalette(i.id)}>
            {i.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
