import { useEffect, useState } from "react"
import { ImageOff, Loader2 } from "lucide-react"

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

function isPublicCdnUrl(url: string): boolean {
  return (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    url.includes("supabase.co/storage/") &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:")
  )
}

function MediaPreview({ mediaId, url, name, kind, className }: MediaPreviewProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setFailed(false)
    setLoading(true)
    setSrc(null)

    async function load() {
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        if (active) {
          setSrc(url)
          setLoading(false)
        }
        return
      }

      if (env.useMockApi) {
        const resolved =
          url.startsWith("/") && !url.startsWith("//") ? `${env.apiBase || ""}${url}` : url
        if (active) {
          setSrc(resolved)
          setLoading(false)
        }
        return
      }

      // Live API: stream bytes with JWT (works for private Supabase buckets).
      if (mediaId) {
        try {
          const blob = await apiFetchBlob(`/api/v1/incidents/media/${mediaId}/content`)
          objectUrl = URL.createObjectURL(blob)
          if (active) {
            setSrc(objectUrl)
            setLoading(false)
          }
          return
        } catch {
          // Fall through — try public Supabase CDN URL if available.
        }
      }

      if (isPublicCdnUrl(url)) {
        if (active) {
          setSrc(url)
          setLoading(false)
        }
        return
      }

      if (active) {
        setFailed(true)
        setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId, url])

  if (loading) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-2 bg-muted px-2 text-muted-foreground",
          className
        )}
      >
        <ImageOff className="size-6" />
        <span className="text-center text-[11px]">
          {name ? `Could not load ${name}` : "Preview unavailable"}
        </span>
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
      onError={() => {
        setFailed(true)
        setSrc(null)
      }}
    />
  )
}

export { MediaPreview }
