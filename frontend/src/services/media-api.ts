import {
  apiAddMedia,
  apiGetMedia,
  apiRemoveMedia,
  type Actor,
} from "@/data/api"
import type { IncidentMedia } from "@/types/incident"

export type MediaUploadInput = {
  file: File
  /** Preview-only URL (blob). Never persisted - upload converts to durable storage. */
  previewUrl?: string
}

const MAX_DATA_URL_BYTES = 400_000

/** Convert file to a durable URL suitable for localStorage / mock DB. */
export async function toDurableMediaUrl(file: File): Promise<string> {
  // Videos and large files: durable static placeholder (Flask will replace with object storage)
  if (file.type.startsWith("video/") || file.size > MAX_DATA_URL_BYTES) {
    return file.type.startsWith("video/") ? "/icons.svg" : "/splash.png"
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read media file."))
    reader.readAsDataURL(file)
  })
}

/**
 * Shared media service for citizen + admin.
 * Sprint 1 mocks upload with durable data URLs / placeholders; Flask swaps storage.
 */
export const mediaApi = {
  list(incidentId: string) {
    return apiGetMedia(incidentId)
  },

  async upload(
    incidentId: string,
    input: MediaUploadInput,
    actor: Actor
  ): Promise<IncidentMedia> {
    const kind: IncidentMedia["kind"] = input.file.type.startsWith("video/")
      ? "video"
      : "image"
    const url = await toDurableMediaUrl(input.file)
    return apiAddMedia(
      incidentId,
      { kind, url, name: input.file.name || `${kind}-${Date.now()}` },
      actor
    )
  },

  add(
    incidentId: string,
    data: Pick<IncidentMedia, "kind" | "url" | "name">,
    actor: Actor
  ) {
    // Reject ephemeral blob URLs at the contract boundary
    const url =
      data.url.startsWith("blob:")
        ? data.kind === "video"
          ? "/icons.svg"
          : "/splash.png"
        : data.url
    return apiAddMedia(incidentId, { ...data, url }, actor)
  },

  remove(id: string, actor: Actor) {
    return apiRemoveMedia(id, actor)
  },
}

/** Convert draft picker items to durable media payloads for create/update. */
export async function toDurableMediaItems(
  items: Array<{
    kind: IncidentMedia["kind"]
    url: string
    name: string
    file?: File
  }>
): Promise<Pick<IncidentMedia, "kind" | "url" | "name">[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.file) {
        return {
          kind: item.kind,
          url: await toDurableMediaUrl(item.file),
          name: item.name,
        }
      }
      const url = item.url.startsWith("blob:")
        ? item.kind === "video"
          ? "/icons.svg"
          : "/splash.png"
        : item.url
      return { kind: item.kind, url, name: item.name }
    })
  )
}
