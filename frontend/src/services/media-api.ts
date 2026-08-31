import {
  apiAddMedia,
  apiGetMedia,
  apiRemoveMedia,
  type Actor,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient } from "@/lib/http-client"
import type { IncidentMedia } from "@/types/incident"

export type MediaUploadInput = {
  file: File
  /** Preview-only URL (blob). Never persisted - upload converts to durable storage. */
  previewUrl?: string
}

const MAX_DATA_URL_BYTES = 400_000

/** Convert file to a durable URL suitable for localStorage / mock DB fallback. */
export async function toDurableMediaUrl(file: File): Promise<string> {
  // Videos and large files: durable static placeholder fallback
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
 * Uploads directly to Flask backend / Supabase Storage bucket with mock fallback.
 */
export const mediaApi = {
  async list(incidentId: string): Promise<IncidentMedia[]> {
    if (env.useMockApi) {
      return apiGetMedia(incidentId)
    }
    return apiClient.get<IncidentMedia[]>(`/api/v1/incidents/${incidentId}/media`)
  },

  async upload(
    incidentId: string,
    input: MediaUploadInput,
    actor: Actor
  ): Promise<IncidentMedia> {
    if (env.useMockApi) {
      const kind: IncidentMedia["kind"] = input.file.type.startsWith("video/")
        ? "video"
        : "image"
      const url = await toDurableMediaUrl(input.file)
      return apiAddMedia(
        incidentId,
        { kind, url, name: input.file.name || `${kind}-${Date.now()}` },
        actor
      )
    }

    const formData = new FormData()
    formData.append("file", input.file)
    return apiClient.post<IncidentMedia>(
      `/api/v1/incidents/${incidentId}/media/upload`,
      formData
    )
  },

  async add(
    incidentId: string,
    data: Pick<IncidentMedia, "kind" | "url" | "name">,
    actor: Actor
  ): Promise<IncidentMedia> {
    if (env.useMockApi) {
      const url =
        data.url.startsWith("blob:")
          ? data.kind === "video"
            ? "/icons.svg"
            : "/splash.png"
          : data.url
      return apiAddMedia(incidentId, { ...data, url }, actor)
    }

    return apiClient.post<IncidentMedia>(`/api/v1/incidents/${incidentId}/media`, {
      kind: data.kind,
      url: data.url,
      name: data.name,
    })
  },

  async remove(id: string, actor: Actor): Promise<boolean> {
    if (env.useMockApi) {
      return apiRemoveMedia(id, actor)
    }
    await apiClient.delete(`/api/v1/incidents/media/${id}`)
    return true
  },
}

export type MediaDraftPayload = Pick<IncidentMedia, "kind" | "url" | "name"> & {
  file?: File
}

/** Convert draft picker items to durable media payloads for create/update. */
export async function toDurableMediaItems(
  items: Array<{
    kind: IncidentMedia["kind"]
    url: string
    name: string
    file?: File
  }>
): Promise<MediaDraftPayload[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.file) {
        const url = env.useMockApi ? await toDurableMediaUrl(item.file) : ""
        return {
          kind: item.kind,
          url,
          name: item.name,
          file: item.file,
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
