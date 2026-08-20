/**
 * Citizen incident reporting API facade.
 * Delegates to lib/incidents → services → mock api.ts (Flask-ready later).
 */
import {
  createIncident as createIncidentRecord,
  fetchIncidentById,
  fetchMyIncidents,
  isCitizenEditable,
  updateMyIncident,
  withdrawMyIncident,
  type Incident,
  type IncidentSeverity,
  type IncidentType,
} from "@/lib/incidents"
import { readSession } from "@/lib/auth-storage"

export type IncidentInput = {
  title: string
  description: string
  type: IncidentType
  severity: IncidentSeverity
  location: string
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

export async function getIncident(id: string): Promise<Incident> {
  const incident = await fetchIncidentById(id)
  if (!incident) throw new Error("Incident not found.")
  const actor = requireActor()
  if (incident.userId !== actor.id) {
    throw new Error("You do not have access to this report.")
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
    severity: input.severity,
    userId: actor.id,
    reporterName: actor.name,
    reporterEmail: actor.email,
    reporterPhone: actor.phone,
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
      severity: input.severity,
    },
    { id: actor.id, name: actor.name }
  )
}

export async function withdrawIncident(id: string): Promise<Incident> {
  const actor = requireActor()
  return withdrawMyIncident(id, { id: actor.id, name: actor.name })
}

export { isCitizenEditable }
