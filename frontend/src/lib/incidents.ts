import { apiGetIncidents, type IncidentRecord } from "@/data/api"

export type Incident = IncidentRecord

export function statusLabel(status: string) {
  if (!status || status === "reported") return "Status Not Set"
  return status.replaceAll("_", " ")
}

export function isUnsetStatus(status: string) {
  return !status || ["reported", "pending", "new"].includes(status.toLowerCase())
}

export async function fetchIncidents(): Promise<Incident[]> {
  return apiGetIncidents()
}
