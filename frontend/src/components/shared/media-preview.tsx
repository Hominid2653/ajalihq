import { useEffect, useState } from "react"
import { ImageOff } from "lucide-react"

import { env } from "@/lib/env"
import { apiFetchBlob } from "@/lib/http-client"
import { cn } from "@/lib/utils"

type MediaPreviewProps = {
  mediaId?: string
  url: string
  name: string
  kind: "image" | "video"
  className?: string
}

function isPublicAbsoluteUrl(url: string): boolean {
  return (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.includes("ajalihq.onrender.com") &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:")
  )
}

function MediaPreview({ mediaId, url, name, kind, className }: MediaPreviewProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setFailed(false)
    setSrc(null)

    async function load() {
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        if (active) setSrc(url)
        return
      }

      if (env.useMockApi || isPublicAbsoluteUrl(url)) {
        const resolved =
          url.startsWith("/") && !url.startsWith("//") ? `${env.apiBase || ""}${url}` : url
        if (active) setSrc(resolved)
        return
      }

      if (mediaId) {
        try {
          const blob = await apiFetchBlob(`/api/v1/incidents/media/${mediaId}/content`)
          objectUrl = URL.createObjectURL(blob)
          if (active) setSrc(objectUrl)
          return
        } catch {
          // Fall through to direct URL attempt below.
        }
      }

      if (url) {
        const resolved =
          url.startsWith("/") && !url.startsWith("//") ? `${env.apiBase || ""}${url}` : url
        if (active) setSrc(resolved)
        return
      }

      if (active) setFailed(true)
    }

    void load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId, url])

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageOff className="size-6" />
        <span className="px-2 text-center text-[11px]">{name || "Preview unavailable"}</span>
      </div>
    )
  }

  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        className={cn("size-full object-cover", className)}
        aria-label={name}
      />
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn("size-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}

export { MediaPreview }
