"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarCropper } from "@/components/avatar-cropper"
import { useI18n } from "@/components/i18n-provider"

export function AccountProfileForm({
  defaultName,
  defaultImage,
}: {
  defaultName: string
  defaultImage: string | null
}) {
  const { t } = useI18n()
  const [name, setName] = useState(defaultName)
  const [image, setImage] = useState<string | null>(defaultImage)
  const [loading, setLoading] = useState(false) // for profile save (name)
  const [uploading, setUploading] = useState(false) // for avatar upload
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { update } = useSession()
  const fileInput = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || t("accountPage.form.errors.updateFailed"))

      // Keep client session in-sync (only name here)
      await update({ name })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("accountPage.form.errors.updateFailed"))
    } finally {
      setLoading(false)
    }
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return
    setError(null)
    // quick client-side validation
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) {
      setError(t("accountPage.form.errors.formats"))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("accountPage.form.errors.maxSize"))
      return
    }

    // open cropper modal with object url
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    setCropOpen(true)
  }

  async function onRemoveAvatar() {
    setError(null)
    setUploading(true)
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "" }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || t("accountPage.form.errors.updateFailed"))
      setImage(null)
      await update({ image: null })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("accountPage.form.errors.updateFailed"))
    } finally {
      setUploading(false)
    }
  }

  async function uploadBlob(blob: Blob) {
    const previous = image
    // optimistic local preview from blob
    const previewUrl = URL.createObjectURL(blob)
    setImage(previewUrl)
    setUploading(true)
    try {
      const fd = new FormData()
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })
      fd.append("file", file)
      const up = await fetch("/api/account/avatar", { method: "POST", body: fd })
      if (!up.ok) throw new Error((await up.json().catch(() => ({})))?.error || t("accountPage.form.errors.uploadFailed"))
      const { url } = await up.json()
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || t("accountPage.form.errors.saveFailed"))
      await update({ image: url })
      router.refresh()
    } catch (err: unknown) {
      setImage(previous)
      setError(err instanceof Error ? err.message : t("accountPage.form.errors.uploadFailed"))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
      if (cropSrc) URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          open={cropOpen}
          onOpenChange={setCropOpen}
          onCancel={() => {
            setCropOpen(false)
            // revoke and reset
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
          onSave={(blob) => {
            setCropOpen(false)
            uploadBlob(blob)
          }}
          outputSize={512}
        />
      )}
      <FieldGroup>
        <Field>
          <FieldLabel>{t("accountPage.form.avatar")}</FieldLabel>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={t("accountPage.form.change") + " avatar"}
              className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => fileInput.current?.click()}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={image ?? undefined} alt={name} />
                <AvatarFallback>
                  {name?.trim()?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="pointer-events-none absolute inset-0 grid place-content-center rounded-full bg-black/40 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : t("accountPage.form.change")}
              </span>
            </button>

            <input
              ref={fileInput}
              id="avatar-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
            />

            <div className="flex items-center gap-2">
              {image && (
                <Button type="button" variant="link" size="sm" onClick={onRemoveAvatar}>
                  {t("accountPage.form.remove")}
                </Button>
              )}
            </div>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="name">{t("accountPage.form.name")}</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("accountPage.form.namePlaceholder")}
            required
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? t("accountPage.form.saving") : t("accountPage.form.saveChanges")}
          </Button>
          {error && (
            <FieldDescription className="text-destructive">{error}</FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}
