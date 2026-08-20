import { useRef, useState } from "react"
import { ImagePlus, Trash2, Video } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { mediaApi } from "@/services/media-api"
import type { Actor } from "@/services/incident-api"
import type { IncidentMedia } from "@/types/incident"
import { cn } from "@/lib/utils"

type PendingMedia = {
  id: string
  kind: "image" | "video"
  url: string
  name: string
  file?: File
}

type IncidentMediaPanelProps = {
  incidentId?: string
  media: IncidentMedia[]
  actor?: Actor | null
  /** Local draft mode (quick-create before incident exists) */
  draft?: PendingMedia[]
  onDraftChange?: (items: PendingMedia[]) => void
  onChanged?: () => void
  className?: string
  readOnly?: boolean
}

function IncidentMediaPanel({
  incidentId,
  media,
  actor,
  draft,
  onDraftChange,
  onChanged,
  className,
  readOnly = false,
}: IncidentMediaPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const items: PendingMedia[] = draft
    ?? media.map((item) => ({
      id: item.id,
      kind: item.kind,
      url: item.url,
      name: item.name,
    }))

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return
    const next: PendingMedia[] = []
    for (const file of Array.from(files)) {
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image"
      const url = URL.createObjectURL(file)
      next.push({ id: `local-${Date.now()}-${file.name}`, kind, url, name: file.name, file })
    }

    if (draft !== undefined && onDraftChange) {
      onDraftChange([...(draft ?? []), ...next])
      return
    }

    if (!incidentId || !actor) {
      toast.error("Sign in required to upload media.")
      return
    }

    setBusy(true)
    try {
      for (const item of next) {
        if (!item.file) continue
        await mediaApi.upload(incidentId, { file: item.file, previewUrl: item.url }, actor)
      }
      toast.success("Media added.")
      onChanged?.()
    } catch {
      toast.error("Could not upload media.")
    } finally {
      setBusy(false)
    }
  }

  async function removeItem(item: PendingMedia) {
    if (draft !== undefined && onDraftChange) {
      onDraftChange(draft.filter((entry) => entry.id !== item.id))
      return
    }
    if (!actor) return
    setBusy(true)
    try {
      await mediaApi.remove(item.id, actor)
      toast.success("Media removed.")
      onChanged?.()
    } catch {
      toast.error("Could not remove media.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void onFilesSelected(event.target.files)
              event.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-2 size-4" />
            Add photos / videos
          </Button>
          {busy ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evidence attached yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border bg-background">
              <div className="relative aspect-video bg-muted">
                {item.kind === "image" ? (
                  <img src={item.url} alt={item.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Video className="size-8" />
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      Open video
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs font-medium">{item.name}</p>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive"
                    disabled={busy}
                    onClick={() => void removeItem(item)}
                    aria-label="Remove media"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export type { PendingMedia }
export { IncidentMediaPanel }
