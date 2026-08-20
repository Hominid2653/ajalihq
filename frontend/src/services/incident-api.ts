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
import type {
  IncidentListQuery,
  IncidentMedia,
  IncidentSeverity,
  IncidentUrgency,
} from "@/types/incident"

export const incidentApi = {
  getAll(options?: IncidentListQuery) {
    return apiGetIncidents(options)
  },
  getById(id: string) {
    return apiGetIncident(id)
  },
  create(data: CreateIncidentInput, actor: Actor) {
    return apiCreateIncident(data, actor)
  },
  update(id: string, patch: UpdateIncidentPatch, actor: Actor) {
    return apiUpdateIncident(id, patch, actor)
  },
  async updateUrgency(id: string, urgency: IncidentUrgency, actor: Actor) {
    return apiUpdateIncident(id, { urgency }, actor)
  },
  async updateSeverity(id: string, severity: IncidentSeverity, actor: Actor) {
    return apiUpdateIncident(id, { severity }, actor)
  },
  archive(id: string, reason: string, actor: Actor) {
    return apiArchiveIncident(id, reason, actor)
  },
  verify(id: string, input: VerifyIncidentInput, actor: Actor) {
    return apiVerifyIncident(id, input, actor)
  },
  close(id: string, input: CloseIncidentInput, actor: Actor) {
    return apiCloseIncident(id, input, actor)
  },
  startResponse(id: string, input: StartResponseInput, actor: Actor) {
    return apiStartResponse(id, input, actor)
  },
  resolve(id: string, input: ResolveIncidentInput, actor: Actor) {
    return apiResolveIncident(id, input, actor)
  },
  reopen(id: string, reason: string, actor: Actor) {
    return apiReopenIncident(id, reason, actor)
  },
  getHistory(incidentId: string) {
    return apiGetHistory(incidentId)
  },
  addNote(incidentId: string, body: string, actor: Actor) {
    return apiAddNote(incidentId, body, actor)
  },
  getNotes(incidentId: string) {
    return apiGetNotes(incidentId)
  },
  getMedia(incidentId: string) {
    return apiGetMedia(incidentId)
  },
  addMedia(
    incidentId: string,
    data: Pick<IncidentMedia, "kind" | "url" | "name">,
    actor: Actor
  ) {
    return apiAddMedia(incidentId, data, actor)
  },
  removeMedia(id: string, actor: Actor) {
    return apiRemoveMedia(id, actor)
  },
  getActive() {
    return apiGetActiveIncidents()
  },
  /** Citizen-facing community reports (verified / in progress / resolved). */
  getCommunity() {
    return apiGetCommunityIncidents()
  },
  getVerification(incidentId: string) {
    return apiGetVerification(incidentId)
  },
  getVerifications(incidentId: string) {
    return apiGetVerifications(incidentId)
  },
  getVerificationStatuses() {
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
