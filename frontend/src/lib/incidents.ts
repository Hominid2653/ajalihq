import { incidentApi } from "@/services/incident-api"
import {
  typeLabel,
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

/** All incidents (admin). */
export async function fetchAllIncidents(): Promise<Incident[]> {
  return incidentApi.getAll()
}

/** Current user's incidents only (citizen). */
export async function fetchMyIncidents(userId: string): Promise<Incident[]> {
  return incidentApi.getAll({ userId })
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
}): Promise<Incident> {
  return incidentApi.create(
    {
      ...input,
      urgency: input.urgency ?? "MEDIUM",
      severity: input.severity ?? "MODERATE",
    },
    {
      id: input.userId,
      name: input.reporterName ?? "Citizen reporter",
    }
  )
}
