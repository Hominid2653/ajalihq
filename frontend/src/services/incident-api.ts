import {
  apiAddMedia,
  apiAddNote,
  apiArchiveIncident,
  apiCloseIncident,
  apiCreateIncident,
  apiGetActiveIncidents,
  apiGetCommunityIncidents,
  apiGetHistory,
  apiGetIncident,
  apiGetIncidents,
  apiGetMedia,
  apiGetNotes,
  apiGetVerification,
  apiGetVerifications,
  apiGetVerificationStatuses,
  apiRemoveMedia,
  apiReopenIncident,
  apiResolveIncident,
  apiStartResponse,
  apiUpdateIncident,
  apiVerifyIncident,
  type Actor,
  type CloseIncidentInput,
  type CreateIncidentInput,
  type ResolveIncidentInput,
  type StartResponseInput,
  type UpdateIncidentPatch,
  type VerifyIncidentInput,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient, ApiError, type PaginatedEnvelope } from "@/lib/http-client"
import type {
  Incident,
  IncidentListItem,
  IncidentListQuery,
  IncidentMedia,
  IncidentNote,
  IncidentSeverity,
  IncidentUrgency,
  ReporterVerification,
  StatusHistory,
} from "@/types/incident"

export interface IncidentDetailBundle {
  incident: Incident
  history: StatusHistory[]
  notes: IncidentNote[]
  media: IncidentMedia[]
  verification: ReporterVerification | null
  verifications: ReporterVerification[]
  handoffs: unknown[]
}

export const incidentApi = {
  async getAll(options?: IncidentListQuery): Promise<IncidentListItem[]> {
    if (!env.useMockApi) {
      const res = await apiClient.get<PaginatedEnvelope<IncidentListItem>>(
        "/api/v1/incidents",
        options as Record<string, unknown>
      )
      return res.items
    }
    return apiGetIncidents(options)
  },

  async getById(id: string): Promise<Incident | null> {
    if (!env.useMockApi) {
      try {
        return await apiClient.get<Incident>(`/api/v1/incidents/${id}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    }
    return apiGetIncident(id)
  },

  async getDetail(id: string): Promise<IncidentDetailBundle | null> {
    if (!env.useMockApi) {
      try {
        return await apiClient.get<IncidentDetailBundle>(`/api/v1/incidents/${id}/detail`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    }
    const incident = await apiGetIncident(id)
    if (!incident) return null
    const [history, notes, media, verification, verifications] = await Promise.all([
      apiGetHistory(id),
      apiGetNotes(id),
      apiGetMedia(id),
      apiGetVerification(id),
      apiGetVerifications(id),
    ])
    return {
      incident,
      history,
      notes,
      media,
      verification,
      verifications,
      handoffs: [],
    }
  },

  async create(data: CreateIncidentInput, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>("/api/v1/incidents", data)
    }
    if (!actor) throw new Error("Actor is required for mock creation")
    return apiCreateIncident(data, actor)
  },

  async update(id: string, patch: UpdateIncidentPatch, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.patch<Incident>(`/api/v1/incidents/${id}`, patch)
    }
    if (!actor) throw new Error("Actor is required for mock update")
    return apiUpdateIncident(id, patch, actor)
  },

  async updateUrgency(id: string, urgency: IncidentUrgency, actor?: Actor): Promise<Incident> {
    return this.update(id, { urgency }, actor)
  },

  async updateSeverity(id: string, severity: IncidentSeverity, actor?: Actor): Promise<Incident> {
    return this.update(id, { severity }, actor)
  },

  async archive(id: string, reason: string, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/archive`, { reason })
    }
    if (!actor) throw new Error("Actor is required for mock archive")
    return apiArchiveIncident(id, reason, actor)
  },

  async verify(id: string, input: VerifyIncidentInput, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/verify`, input)
    }
    if (!actor) throw new Error("Actor is required for mock verify")
    return apiVerifyIncident(id, input, actor)
  },

  async close(id: string, input: CloseIncidentInput, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/close`, input)
    }
    if (!actor) throw new Error("Actor is required for mock close")
    return apiCloseIncident(id, input, actor)
  },

  async startResponse(id: string, input: StartResponseInput, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/start-response`, input)
    }
    if (!actor) throw new Error("Actor is required for mock startResponse")
    return apiStartResponse(id, input, actor)
  },

  async resolve(id: string, input: ResolveIncidentInput, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/resolve`, input)
    }
    if (!actor) throw new Error("Actor is required for mock resolve")
    return apiResolveIncident(id, input, actor)
  },

  async reopen(id: string, reason: string, actor?: Actor): Promise<Incident> {
    if (!env.useMockApi) {
      return apiClient.post<Incident>(`/api/v1/incidents/${id}/reopen`, { reason })
    }
    if (!actor) throw new Error("Actor is required for mock reopen")
    return apiReopenIncident(id, reason, actor)
  },

  async getHistory(incidentId: string): Promise<StatusHistory[]> {
    if (!env.useMockApi) {
      return apiClient.get<StatusHistory[]>(`/api/v1/incidents/${incidentId}/history`)
    }
    return apiGetHistory(incidentId)
  },

  async addNote(incidentId: string, body: string, actor?: Actor): Promise<IncidentNote> {
    if (!env.useMockApi) {
      return apiClient.post<IncidentNote>(`/api/v1/incidents/${incidentId}/notes`, { body })
    }
    if (!actor) throw new Error("Actor is required for mock addNote")
    return apiAddNote(incidentId, body, actor)
  },

  async getNotes(incidentId: string): Promise<IncidentNote[]> {
    if (!env.useMockApi) {
      return apiClient.get<IncidentNote[]>(`/api/v1/incidents/${incidentId}/notes`)
    }
    return apiGetNotes(incidentId)
  },

  async getMedia(incidentId: string): Promise<IncidentMedia[]> {
    if (!env.useMockApi) {
      return apiClient.get<IncidentMedia[]>(`/api/v1/incidents/${incidentId}/media`)
    }
    return apiGetMedia(incidentId)
  },

  async addMedia(
    incidentId: string,
    data: Pick<IncidentMedia, "kind" | "url" | "name">,
    actor?: Actor
  ): Promise<IncidentMedia> {
    if (!env.useMockApi) {
      return apiClient.post<IncidentMedia>(`/api/v1/incidents/${incidentId}/media`, data)
    }
    if (!actor) throw new Error("Actor is required for mock addMedia")
    return apiAddMedia(incidentId, data, actor)
  },

  async removeMedia(id: string, actor?: Actor): Promise<boolean> {
    if (!env.useMockApi) {
      try {
        await apiClient.delete<void>(`/api/v1/incidents/media/${id}`)
        return true
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return false
        throw err
      }
    }
    if (!actor) throw new Error("Actor is required for mock removeMedia")
    return apiRemoveMedia(id, actor)
  },

  async getActive(): Promise<Incident[]> {
    if (!env.useMockApi) {
      return apiClient.get<Incident[]>("/api/v1/incidents/active", undefined, { skipAuth: true })
    }
    return apiGetActiveIncidents()
  },

  /** Citizen-facing community reports (verified / in progress / resolved). */
  async getCommunity(): Promise<Incident[]> {
    if (!env.useMockApi) {
      return apiClient.get<Incident[]>("/api/v1/incidents/community", undefined, { skipAuth: true })
    }
    return apiGetCommunityIncidents()
  },

  async getVerification(incidentId: string): Promise<ReporterVerification | null> {
    if (!env.useMockApi) {
      try {
        return await apiClient.get<ReporterVerification>(`/api/v1/incidents/${incidentId}/verification`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    }
    return apiGetVerification(incidentId)
  },

  async getVerifications(incidentId: string): Promise<ReporterVerification[]> {
    if (!env.useMockApi) {
      return apiClient.get<ReporterVerification[]>(`/api/v1/incidents/${incidentId}/verifications`)
    }
    return apiGetVerifications(incidentId)
  },

  async getVerificationStatuses(): Promise<Record<string, string>> {
    if (!env.useMockApi) {
      return apiClient.get<Record<string, string>>("/api/v1/incidents/verification-statuses")
    }
    return apiGetVerificationStatuses()
  },
}

export type {
  Actor,
  CloseIncidentInput,
  CreateIncidentInput,
  ResolveIncidentInput,
  StartResponseInput,
  UpdateIncidentPatch,
  VerifyIncidentInput,
}
