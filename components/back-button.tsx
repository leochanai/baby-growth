"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push(fallback)
      }}
    >
      <ArrowLeft className="mr-2 size-4" /> Back
    </Button>
  )
}

