import {
  apiCreateIncident,
  apiDeleteIncident,
  apiGetIncident,
  apiGetIncidents,
  apiUpdateIncident,
  apiWithdrawIncident,
  type IncidentRecord,
} from "@/data/api"
import type { Incident, IncidentInput } from "@/types/incident"

// TODO: swap userId for the real signed-in user's id once auth is wired
// into the incident flow. Hardcoded for now since RequireSession doesn't
// yet expose the current user to these calls.
const CURRENT_USER_ID = "1"

function toIncident(record: IncidentRecord): Incident {
  return {
    id: record.id,
    referenceNumber: record.referenceNumber,
    title: record.title,
    description: record.description,
    incidentType: record.incidentType,
    severity: record.severity,
    status: record.status as Incident["status"],
    location: record.location,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export async function listIncidents(): Promise<Incident[]> {
  const records = await apiGetIncidents()
  return records.map(toIncident)
}

export async function getIncident(id: string): Promise<Incident> {
  const record = await apiGetIncident(id)
  if (!record) {
    throw new Error(`Incident ${id} not found`)
  }
  return toIncident(record)
}

export async function createIncident(input: IncidentInput): Promise<Incident> {
  const record = await apiCreateIncident({ ...input, userId: CURRENT_USER_ID })
  return toIncident(record)
}

export async function updateIncident(
  id: string,
  input: Partial<IncidentInput>
): Promise<Incident> {
  const record = await apiUpdateIncident(id, input)
  return toIncident(record)
}

export async function withdrawIncident(id: string): Promise<Incident> {
  const record = await apiWithdrawIncident(id)
  return toIncident(record)
}

export async function deleteIncident(id: string): Promise<void> {
  await apiDeleteIncident(id)
}