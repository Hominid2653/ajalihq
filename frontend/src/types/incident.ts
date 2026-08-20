/** Domain models for Ajali! incident operations (Sprint 1 mock + Sprint 2 Flask-ready). */

export type IncidentStatus =
  | "PENDING"
  | "VERIFIED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"

/** How quickly the report needs administrative attention. */
export type IncidentUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

/** How serious the actual incident is. */
export type IncidentSeverity = "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL"

export type IncidentType =
  | "accident"
  | "fire"
  | "medical"
  | "crime"
  | "disaster"

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS"

export type PreferredContactMethod = "PHONE" | "EMAIL" | "OTHER"

export type VerificationStatus = "PENDING" | "VERIFIED" | "FAILED"

export type VerificationMethod = "PHONE" | "EMAIL" | "OTHER"

export type CloseReasonCode =
  | "FALSE_REPORT"
  | "DUPLICATE"
  | "UNABLE_TO_VERIFY"
  | "INSUFFICIENT_INFORMATION"
  | "OTHER"

export type DepartmentType =
  | "POLICE"
  | "FIRE"
  | "HOSPITAL"
  | "AMBULANCE"
  | "DISASTER_RESPONSE"
  | "OTHER"

export type HandoffStatus =
  | "PENDING"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type ResolutionOutcome =
  | "RESOLVED"
  | "ASSISTANCE_PROVIDED"
  | "REFERRED"
  | "UNABLE_TO_ASSIST"
  | "OTHER"

export type Incident = {
  id: string
  reference: string
  title: string
  description: string
  type: IncidentType
  urgency: IncidentUrgency
  severity: IncidentSeverity
  status: IncidentStatus
  location: string
  lat: number | null
  lng: number | null
  userId: string
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  preferredContactMethod?: PreferredContactMethod
  /** Latest verification record id when present */
  verificationId?: string
  closeReasonCode?: CloseReasonCode
  resolutionSummary?: string
  resolutionNotes?: string
  resolutionOutcome?: ResolutionOutcome
  resolvedById?: string
  resolvedByName?: string
  resolvedAt?: string
  archived: boolean
  archiveReason?: string
  createdAt: string
  updatedAt: string
}

export type ReporterVerification = {
  id: string
  incidentId: string
  status: VerificationStatus
  method?: VerificationMethod
  notes?: string
  verifiedById?: string
  verifiedByName?: string
  verifiedAt?: string
  createdAt: string
  updatedAt: string
}

export type Department = {
  id: string
  name: string
  type: DepartmentType
  description?: string
  phone?: string
  email?: string
  location?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type DepartmentHandoff = {
  id: string
  incidentId: string
  departmentId: string
  initiatedById: string
  initiatedByName: string
  status: HandoffStatus
  notes?: string
  handedOffAt: string
  acknowledgedAt?: string
  completedAt?: string
  updatedAt: string
}

export type IncidentMedia = {
  id: string
  incidentId: string
  kind: "image" | "video"
  url: string
  name: string
  createdAt: string
}

export type IncidentNote = {
  id: string
  incidentId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export type StatusHistory = {
  id: string
  incidentId: string
  fromStatus: IncidentStatus | null
  toStatus: IncidentStatus
  actorId: string
  actorName: string
  reason?: string
  createdAt: string
}

export type AuditLog = {
  id: string
  incidentId?: string
  /** Denormalized for UI — Flask can join or store */
  incidentReference?: string
  actorId: string
  actorName: string
  action: AuditAction | string
  previousValue?: string
  newValue?: string
  reason?: string
  metadata?: string
  createdAt: string
}

export type AppNotification = {
  id: string
  incidentId?: string
  type: NotificationEventType | string
  channel: NotificationChannel
  title: string
  body: string
  read: boolean
  createdAt: string
}

/** List DTO — includes latest verification without N+1 */
export type IncidentListItem = Incident & {
  verificationStatus: VerificationStatus
}

export type IncidentListQuery = {
  userId?: string
  status?: IncidentStatus
  /** When set, matches any of these statuses (ignored if `status` is set). */
  statusIn?: IncidentStatus[]
  urgency?: IncidentUrgency
  severity?: IncidentSeverity
  type?: IncidentType
  departmentId?: string
  verificationStatus?: VerificationStatus
  location?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sort?: "urgency" | "newest"
  includeArchived?: boolean
}

export type AuditAction =
  | "REPORT_CREATED"
  | "REPORT_UPDATED"
  | "REPORT_VERIFIED"
  | "REPORT_CLOSED"
  | "RESPONSE_STARTED"
  | "DEPARTMENT_ASSIGNED"
  | "DEPARTMENT_HANDOFF_UPDATED"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_REOPENED"
  | "INCIDENT_ARCHIVED"
  | "MEDIA_ADDED"
  | "MEDIA_REMOVED"
  | "NOTE_ADDED"
  | "CITIZEN_NOTIFIED"
  | "URGENCY_UPDATED"
  | "SEVERITY_UPDATED"

export type NotificationEventType =
  | "REPORT_RECEIVED"
  | "CRITICAL_REPORT_RECEIVED"
  | "REPORT_VERIFIED"
  | "REPORT_CLOSED"
  | "RESPONSE_STARTED"
  | "DEPARTMENT_ASSIGNED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_ARCHIVED"
  | "CITIZEN_STATUS_NOTIFY"
  | "CRITICAL_INCIDENT"
  | "STATUS_IN_PROGRESS"

export type DashboardStats = {
  total: number
  pending: number
  verified: number
  inProgress: number
  resolved: number
  closed: number
  /** Critical urgency (admin attention) */
  criticalUrgency: number
  /** Critical severity (incident seriousness) */
  criticalSeverity: number
  awaitingVerification: number
  awaitingResponse: number
  awaitingHandoffAck: number
  today: number
}

export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  PENDING: ["VERIFIED", "CLOSED"],
  VERIFIED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["IN_PROGRESS"],
  CLOSED: ["PENDING"],
}

export const URGENCY_RANK: Record<IncidentUrgency, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export function canTransition(
  from: IncidentStatus,
  to: IncidentStatus
): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}

export function statusLabel(status: IncidentStatus): string {
  const labels: Record<IncidentStatus, string> = {
    PENDING: "Pending",
    VERIFIED: "Verified",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  }
  return labels[status]
}

export function urgencyLabel(urgency: IncidentUrgency): string {
  const labels: Record<IncidentUrgency, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  }
  return labels[urgency]
}

export function severityLabel(severity: IncidentSeverity): string {
  const labels: Record<IncidentSeverity, string> = {
    MINOR: "Minor",
    MODERATE: "Moderate",
    MAJOR: "Major",
    CRITICAL: "Critical",
  }
  return labels[severity]
}

export function typeLabel(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    accident: "Accident",
    fire: "Fire",
    medical: "Medical",
    crime: "Crime",
    disaster: "Disaster",
  }
  return labels[type]
}

export function departmentTypeLabel(type: DepartmentType): string {
  const labels: Record<DepartmentType, string> = {
    POLICE: "Police",
    FIRE: "Fire & Rescue",
    HOSPITAL: "Hospital",
    AMBULANCE: "Ambulance",
    DISASTER_RESPONSE: "Disaster Response",
    OTHER: "Other",
  }
  return labels[type]
}

export function verificationStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    PENDING: "Not verified",
    VERIFIED: "Verified",
    FAILED: "Failed",
  }
  return labels[status]
}

export function closeReasonLabel(code: CloseReasonCode): string {
  const labels: Record<CloseReasonCode, string> = {
    FALSE_REPORT: "False report",
    DUPLICATE: "Duplicate",
    UNABLE_TO_VERIFY: "Unable to verify",
    INSUFFICIENT_INFORMATION: "Insufficient information",
    OTHER: "Other",
  }
  return labels[code]
}

export function handoffStatusLabel(status: HandoffStatus): string {
  const labels: Record<HandoffStatus, string> = {
    PENDING: "Pending",
    ACKNOWLEDGED: "Acknowledged",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  }
  return labels[status]
}

export function resolutionOutcomeLabel(outcome: ResolutionOutcome): string {
  const labels: Record<ResolutionOutcome, string> = {
    RESOLVED: "Resolved",
    ASSISTANCE_PROVIDED: "Assistance provided",
    REFERRED: "Referred",
    UNABLE_TO_ASSIST: "Unable to assist",
    OTHER: "Other",
  }
  return labels[outcome]
}

/** Compare urgency first (critical first), then newest createdAt. */
export function compareByUrgencyThenNewest(a: Incident, b: Incident): number {
  const urg = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]
  if (urg !== 0) return urg
  return b.createdAt.localeCompare(a.createdAt)
}
