/**
 * Citizen incident reporting API facade.
 * Delegates to lib/incidents → services → mock api.ts (Flask-ready later).
 * Payload fields match admin CreateIncidentInput / Incident model.
 */
import {
  createIncident as createIncidentRecord,
  fetchCommunityIncidents,
  fetchIncidentById,
  fetchMyIncidents,
  isCitizenEditable,
  isCommunityVisible,
  updateMyIncident,
  withdrawMyIncident,
  type Incident,
  type IncidentSeverity,
  type IncidentType,
  type IncidentUrgency,
} from "@/lib/incidents"
import { readSession } from "@/lib/auth-storage"
import type { PreferredContactMethod } from "@/types/incident"

export type IncidentInput = {
  title: string
  description: string
  type: IncidentType
  urgency: IncidentUrgency
  severity: IncidentSeverity
  location: string
  reporterPhone?: string
  reporterEmail?: string
  preferredContactMethod?: PreferredContactMethod
  lat?: number | null
  lng?: number | null
  media?: Pick<
    import("@/types/incident").IncidentMedia,
    "kind" | "url" | "name"
  >[]
}

function requireActor() {
  const session = readSession()
  if (!session) throw new Error("You must be signed in.")
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    phone: session.phone,
  }
}

export async function listIncidents(): Promise<Incident[]> {
  const actor = requireActor()
  return fetchMyIncidents(actor.id)
}

/** Community reports shared across citizen map + dashboard (all users). */
export async function listCommunityIncidents(): Promise<Incident[]> {
  requireActor()
  return fetchCommunityIncidents()
}

export async function getIncident(id: string): Promise<Incident> {
  const incident = await fetchIncidentById(id)
  if (!incident) throw new Error("Incident not found.")
  const actor = requireActor()
  const isOwner = incident.userId === actor.id
  if (!isOwner && !isCommunityVisible(incident)) {
    throw new Error("You do not have access to this report.")
  }
  // Hide private contact details from other citizens
  if (!isOwner) {
    return {
      ...incident,
      reporterPhone: undefined,
      reporterEmail: undefined,
      preferredContactMethod: undefined,
    }
  }
  return incident
}

export async function createIncident(input: IncidentInput): Promise<Incident> {
  const actor = requireActor()
  return createIncidentRecord({
    title: input.title,
    description: input.description,
    location: input.location,
    type: input.type,
    urgency: input.urgency,
    severity: input.severity,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    userId: actor.id,
    reporterName: actor.name,
    reporterEmail: input.reporterEmail?.trim() || actor.email,
    reporterPhone: input.reporterPhone?.trim() || actor.phone,
    preferredContactMethod: input.preferredContactMethod ?? "PHONE",
    media: input.media,
  })
}

export async function updateIncident(
  id: string,
  input: IncidentInput
): Promise<Incident> {
  const actor = requireActor()
  return updateMyIncident(
    id,
    {
      title: input.title,
      description: input.description,
      location: input.location,
      type: input.type,
      urgency: input.urgency,
      severity: input.severity,
      lat: input.lat,
      lng: input.lng,
      reporterPhone: input.reporterPhone,
      reporterEmail: input.reporterEmail,
      preferredContactMethod: input.preferredContactMethod,
    },
    { id: actor.id, name: actor.name }
  )
}

export async function withdrawIncident(id: string): Promise<Incident> {
  const actor = requireActor()
  return withdrawMyIncident(id, { id: actor.id, name: actor.name })
}

export { isCitizenEditable, isCommunityVisible }
