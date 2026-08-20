
export const INCIDENT_TYPES = [
  "traffic",
  "fire",
  "flooding",
  "medical",
  "security",
  "infrastructure",
  "other",
] as const

export type IncidentType = (typeof INCIDENT_TYPES)[number]

export const SEVERITIES = ["low", "medium", "high", "critical"] as const

export type Severity = (typeof SEVERITIES)[number]

export const STATUSES = [
  "reported",
  "investigating",
  "resolved",
  "withdrawn",
] as const

export type IncidentStatus = (typeof STATUSES)[number]

export interface Incident {
  id: string
  referenceNumber: string
  title: string
  description: string
  incidentType: IncidentType
  severity: Severity
  status: IncidentStatus
  location: string
  userId: string
  createdAt: string
  updatedAt?: string
}

// Payload the form collects. Server assigns id/referenceNumber/status/timestamps.
export interface IncidentInput {
  title: string
  description: string
  incidentType: IncidentType
  severity: Severity
  location: string
}

// Human-readable labels for selects and badges.
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  traffic: "Traffic",
  fire: "Fire",
  flooding: "Flooding",
  medical: "Medical",
  security: "Security",
  infrastructure: "Infrastructure",
  other: "Other",
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Reported",
  investigating: "Investigating",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
}

export function isEligibleForWithdrawOrDelete(incident: Incident): boolean {
  return incident.status === "reported"
}