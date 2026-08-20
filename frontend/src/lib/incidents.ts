import { incidentApi } from "@/services/incident-api"
import {
  severityLabel,
  typeLabel,
  urgencyLabel,
  type IncidentSeverity,
  type IncidentType,
  type IncidentUrgency,
} from "@/types/incident"

export type {
  AppNotification,
  AuditLog,
  DashboardStats,
  Incident,
  IncidentMedia,
  IncidentNote,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  IncidentUrgency,
  NotificationChannel,
  StatusHistory,
} from "@/types/incident"
export {
  canTransition,
  severityLabel,
  STATUS_TRANSITIONS,
  statusLabel,
  typeLabel,
  urgencyLabel,
} from "@/types/incident"
import type { Incident } from "@/types/incident"

export const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "accident", label: typeLabel("accident") },
  { value: "fire", label: typeLabel("fire") },
  { value: "medical", label: typeLabel("medical") },
  { value: "crime", label: typeLabel("crime") },
  { value: "disaster", label: typeLabel("disaster") },
]

export const INCIDENT_SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: "MINOR", label: severityLabel("MINOR") },
  { value: "MODERATE", label: severityLabel("MODERATE") },
  { value: "MAJOR", label: severityLabel("MAJOR") },
  { value: "CRITICAL", label: severityLabel("CRITICAL") },
]

export const INCIDENT_URGENCIES: { value: IncidentUrgency; label: string }[] = [
  { value: "LOW", label: urgencyLabel("LOW") },
  { value: "MEDIUM", label: urgencyLabel("MEDIUM") },
  { value: "HIGH", label: urgencyLabel("HIGH") },
  { value: "CRITICAL", label: urgencyLabel("CRITICAL") },
]

export const INCIDENT_STATUSES = [
  "PENDING",
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const

export function isUnsetStatus(status: string) {
  return status === "PENDING"
}

export function isActiveStatus(status: string) {
  return status === "IN_PROGRESS"
}

export function isResolvedStatus(status: string) {
  return status === "RESOLVED"
}

/** Statuses other citizens may see on the map and in community detail. */
export const COMMUNITY_STATUSES = [
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
] as const

export function isCommunityVisible(incident: Incident): boolean {
  return (
    !incident.archived &&
    (COMMUNITY_STATUSES as readonly string[]).includes(incident.status)
  )
}

/** Citizen may edit / withdraw only while the report is still pending review. */
export function isCitizenEditable(incident: Incident): boolean {
  return !incident.archived && incident.status === "PENDING"
}

/** All incidents (admin). */
export async function fetchAllIncidents(): Promise<Incident[]> {
  return incidentApi.getAll()
}

/** Current user's incidents only (citizen "My incidents"). */
export async function fetchMyIncidents(userId: string): Promise<Incident[]> {
  return incidentApi.getAll({ userId })
}

/**
 * Shared citizen map/community feed - verified, in-progress, and resolved
 * reports from all users (same source for dashboard map + map page).
 */
export async function fetchCommunityIncidents(): Promise<Incident[]> {
  return incidentApi.getCommunity()
}

/** Community reports that have map coordinates. */
export async function fetchCommunityMapIncidents(): Promise<
  (Incident & { lat: number; lng: number })[]
> {
  const list = await fetchCommunityIncidents()
  return list.filter(
    (item): item is Incident & { lat: number; lng: number } =>
      item.lat !== null && item.lng !== null
  )
}

/** @deprecated Use fetchAllIncidents or fetchMyIncidents */
export async function fetchIncidents(userId?: string): Promise<Incident[]> {
  return userId ? fetchMyIncidents(userId) : fetchAllIncidents()
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  return incidentApi.getById(id)
}

export async function createIncident(input: {
  title: string
  description: string
  location: string
  userId: string
  type?: IncidentType
  urgency?: IncidentUrgency
  severity?: IncidentSeverity
  lat?: number | null
  lng?: number | null
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  preferredContactMethod?: import("@/types/incident").PreferredContactMethod
  media?: Pick<
    import("@/types/incident").IncidentMedia,
    "kind" | "url" | "name"
  >[]
}): Promise<Incident> {
  return incidentApi.create(
    {
      ...input,
      urgency: input.urgency ?? "MEDIUM",
      severity: input.severity ?? "MODERATE",
      preferredContactMethod: input.preferredContactMethod ?? "PHONE",
      media: input.media,
    },
    {
      id: input.userId,
      name: input.reporterName ?? "Citizen reporter",
    }
  )
}

export async function updateMyIncident(
  id: string,
  patch: {
    title?: string
    description?: string
    type?: IncidentType
    urgency?: IncidentUrgency
    severity?: IncidentSeverity
    location?: string
    lat?: number | null
    lng?: number | null
    reporterPhone?: string
    reporterEmail?: string
    preferredContactMethod?: import("@/types/incident").PreferredContactMethod
  },
  actor: { id: string; name: string }
): Promise<Incident> {
  const current = await incidentApi.getById(id)
  if (!current) throw new Error("Incident not found.")
  if (current.userId !== actor.id) {
    throw new Error("You can only edit your own reports.")
  }
  if (!isCitizenEditable(current)) {
    throw new Error("Only pending reports can be edited.")
  }
  return incidentApi.update(id, patch, actor)
}

/** Soft withdraw - closes a PENDING report (keeps audit trail; no hard delete). */
export async function withdrawMyIncident(
  id: string,
  actor: { id: string; name: string }
): Promise<Incident> {
  const current = await incidentApi.getById(id)
  if (!current) throw new Error("Incident not found.")
  if (current.userId !== actor.id) {
    throw new Error("You can only withdraw your own reports.")
  }
  if (!isCitizenEditable(current)) {
    throw new Error("Only pending reports can be withdrawn.")
  }
  return incidentApi.close(
    id,
    {
      reason: "Withdrawn by reporter",
      reasonCode: "OTHER",
      failVerification: true,
    },
    actor
  )
}
