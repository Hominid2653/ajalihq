import {
  apiGetIncident,
  apiGetIncidents,
  apiUpdateIncidentStatus,
  type IncidentRecord,
} from "@/data/api"

export type Incident = IncidentRecord

/** Admin workflow statuses */
export const INCIDENT_STATUSES = [
  "reported",
  "pending",
  "verified",
  "investigating",
  "resolved",
  "closed",
] as const

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export function statusLabel(status: string) {
  if (!status || status === "reported") return "Status Not Set"
  return status.replaceAll("_", " ")
}

export function isUnsetStatus(status: string) {
  return !status || ["reported", "pending", "new"].includes(status.toLowerCase())
}

/** All incidents (admin). */
export async function fetchAllIncidents(): Promise<Incident[]> {
  return apiGetIncidents()
}

/** Current user's incidents only (citizen). */
export async function fetchMyIncidents(userId: string): Promise<Incident[]> {
  return apiGetIncidents({ userId })
}

/** @deprecated Use fetchAllIncidents or fetchMyIncidents */
export async function fetchIncidents(userId?: string): Promise<Incident[]> {
  return userId ? fetchMyIncidents(userId) : fetchAllIncidents()
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  return apiGetIncident(id)
}

export async function updateIncidentStatus(
  id: string,
  status: string
): Promise<Incident | null> {
  return apiUpdateIncidentStatus(id, status)
}
