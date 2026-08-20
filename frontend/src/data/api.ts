/**
 * Stateful in-browser REST abstraction for Sprint 1.
 * Replace this implementation with HTTP calls in Sprint 2; consumers use services.
 */
import { normalizeRole, type Role } from "@/types/auth"
import {
  canTransition,
  compareByUrgencyThenNewest,
  statusLabel,
  type AppNotification,
  type AuditLog,
  type CloseReasonCode,
  type DashboardStats,
  type Department,
  type DepartmentHandoff,
  type DepartmentType,
  type HandoffStatus,
  type Incident,
  type IncidentListItem,
  type IncidentListQuery,
  type IncidentMedia,
  type IncidentNote,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
  type IncidentUrgency,
  type PreferredContactMethod,
  type ReporterVerification,
  type ResolutionOutcome,
  type StatusHistory,
  type VerificationMethod,
  type VerificationStatus,
} from "@/types/incident"

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatarUrl?: string
  location?: string
  bio?: string
  preferredContactMethod?: "PHONE" | "EMAIL" | "OTHER"
  profileComplete?: boolean
}

export type Actor = { id: string; name: string }

export type CreateIncidentInput = {
  title: string
  description: string
  type?: IncidentType
  urgency?: IncidentUrgency
  severity?: IncidentSeverity
  location: string
  lat?: number | null
  lng?: number | null
  userId: string
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  preferredContactMethod?: PreferredContactMethod
  media?: Pick<IncidentMedia, "kind" | "url" | "name">[]
}

export type UpdateIncidentPatch = Partial<
  Pick<
    Incident,
    | "title"
    | "description"
    | "type"
    | "urgency"
    | "severity"
    | "location"
    | "lat"
    | "lng"
    | "userId"
    | "reporterName"
    | "reporterEmail"
    | "reporterPhone"
    | "preferredContactMethod"
  >
>

export type VerifyIncidentInput = {
  method: VerificationMethod
  notes?: string
}

export type CloseIncidentInput = {
  reason: string
  reasonCode?: CloseReasonCode
  failVerification?: boolean
}

export type StartResponseInput = {
  departmentIds: string[]
  notes?: string
}

export type ResolveIncidentInput = {
  summary: string
  notes?: string
  outcome: ResolutionOutcome
  completeHandoffs?: boolean
  /** Prompted at resolution - Sprint 1 mocks SMS/EMAIL delivery. */
  notifyCitizen?: {
    sms?: boolean
    email?: boolean
  }
}

export type CreateDepartmentInput = {
  name: string
  type: DepartmentType
  description?: string
  phone?: string
  email?: string
  location?: string
  active?: boolean
}

export type UpdateDepartmentPatch = Partial<CreateDepartmentInput>

export type UpdateHandoffInput = {
  status: HandoffStatus
  notes?: string
}

type Database = {
  users: UserRecord[]
  incidents: Incident[]
  departments: Department[]
  verifications: ReporterVerification[]
  handoffs: DepartmentHandoff[]
  media: IncidentMedia[]
  notes: IncidentNote[]
  statusHistory: StatusHistory[]
  auditLogs: AuditLog[]
  notifications: AppNotification[]
}

const STORAGE_KEY = "ajali-data"
const STORAGE_VERSION = 7

const users: UserRecord[] = [
  { id: "1", name: "Amina Otieno", email: "amina@ajalihq.test", role: "USER", phone: "+254700111222", location: "Nairobi", preferredContactMethod: "PHONE", profileComplete: true },
  { id: "2", name: "Brian Mwangi", email: "brian@ajalihq.test", role: "ADMIN", phone: "+254711222333", location: "Nairobi", preferredContactMethod: "PHONE", profileComplete: true },
  { id: "3", name: "Grace Wanjiku", email: "grace@ajalihq.test", role: "USER", phone: "+254722333444", location: "Nakuru", preferredContactMethod: "PHONE", profileComplete: true },
  { id: "4", name: "Daniel Kipchoge", email: "daniel@ajalihq.test", role: "USER", phone: "+254733444555", location: "Eldoret", preferredContactMethod: "PHONE", profileComplete: true },
  { id: "5", name: "Faith Njeri", email: "faith@ajalihq.test", role: "ADMIN", phone: "+254744555666", location: "Nairobi", preferredContactMethod: "EMAIL", profileComplete: true },
  { id: "6", name: "Hassan Ali", email: "hassan@ajalihq.test", role: "USER", phone: "+254755666777", location: "Mombasa", preferredContactMethod: "PHONE", profileComplete: true },
]

const departments: Department[] = [
  {
    id: "dept-1", name: "Kenya Police Service", type: "POLICE",
    description: "National police response and scene security.",
    phone: "+25420XXXXXXX", email: "ops@police.example.ke", location: "Nairobi",
    active: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dept-2", name: "Fire & Rescue", type: "FIRE",
    description: "Fire suppression and technical rescue.",
    phone: "+254711000001", email: "dispatch@fire.example.ke", location: "Nairobi",
    active: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dept-3", name: "Hospital / Ambulance", type: "AMBULANCE",
    description: "Emergency medical transport and triage.",
    phone: "+254711000002", email: "ems@hospital.example.ke", location: "Nairobi",
    active: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dept-4", name: "County Disaster Management", type: "DISASTER_RESPONSE",
    description: "County-level disaster coordination.",
    phone: "+254711000003", email: "cdm@county.example.ke", location: "Nakuru",
    active: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dept-5", name: "Red Cross", type: "OTHER",
    description: "Humanitarian first response and shelters.",
    phone: "+254711000004", email: "ops@redcross.example.ke", location: "Kenya",
    active: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dept-6", name: "Legacy Staging Unit", type: "OTHER",
    description: "Inactive staging contact used for demos.",
    phone: "+254711000099", active: false,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

const incidents: Incident[] = [
  {
    id: "1", reference: "AJL-0001", title: "Collision on Mombasa Road",
    description: "Two vehicles collided near the Nyayo Stadium exit; one lane is blocked.",
    type: "accident", urgency: "HIGH", severity: "MAJOR", status: "PENDING",
    location: "Mombasa Road, Nairobi", lat: -1.3102, lng: 36.8348, userId: "1",
    reporterName: "Amina Otieno", reporterEmail: "amina@ajalihq.test",
    reporterPhone: "+254700111222", preferredContactMethod: "PHONE",
    archived: false, createdAt: "2026-08-20T06:40:00.000Z", updatedAt: "2026-08-20T06:40:00.000Z",
  },
  {
    id: "2", reference: "AJL-0002", title: "Market fire in Gikomba",
    description: "Smoke and flames are spreading between several market stalls.",
    type: "fire", urgency: "CRITICAL", severity: "CRITICAL", status: "VERIFIED",
    location: "Gikomba Market, Nairobi", lat: -1.2839, lng: 36.8405, userId: "3",
    reporterName: "Grace Wanjiku", reporterEmail: "grace@ajalihq.test",
    reporterPhone: "+254722333444", preferredContactMethod: "PHONE",
    verificationId: "ver-2", archived: false,
    createdAt: "2026-08-20T05:05:00.000Z", updatedAt: "2026-08-20T05:22:00.000Z",
  },
  {
    id: "3", reference: "AJL-0003", title: "Flooding near Kaptembwo",
    description: "Flood water has entered homes and the access road is impassable.",
    type: "disaster", urgency: "CRITICAL", severity: "CRITICAL", status: "IN_PROGRESS",
    location: "Kaptembwo, Nakuru", lat: -0.3031, lng: 36.0800, userId: "4",
    reporterName: "Daniel Kipchoge", reporterEmail: "daniel@ajalihq.test",
    reporterPhone: "+254733444555", preferredContactMethod: "PHONE",
    verificationId: "ver-3", archived: false,
    createdAt: "2026-08-19T15:10:00.000Z", updatedAt: "2026-08-20T04:30:00.000Z",
  },
  {
    id: "4", reference: "AJL-0004", title: "Medical emergency at ferry terminal",
    description: "A passenger collapsed while waiting to board and needs urgent care.",
    type: "medical", urgency: "HIGH", severity: "MAJOR", status: "IN_PROGRESS",
    location: "Likoni Ferry, Mombasa", lat: -4.0838, lng: 39.6612, userId: "6",
    reporterName: "Hassan Ali", reporterEmail: "hassan@ajalihq.test",
    reporterPhone: "+254755666777", preferredContactMethod: "PHONE",
    verificationId: "ver-4", archived: false,
    createdAt: "2026-08-20T07:12:00.000Z", updatedAt: "2026-08-20T07:27:00.000Z",
  },
  {
    id: "5", reference: "AJL-0005", title: "Robbery near Oginga Odinga Street",
    description: "Shop attendants reported an armed robbery; police attended the scene.",
    type: "crime", urgency: "MEDIUM", severity: "MAJOR", status: "RESOLVED",
    location: "Kisumu CBD, Kisumu", lat: -0.1022, lng: 34.7617, userId: "3",
    reporterName: "Grace Wanjiku", reporterEmail: "grace@ajalihq.test",
    preferredContactMethod: "EMAIL", verificationId: "ver-5",
    resolutionSummary: "Police secured the scene and took statements.",
    resolutionOutcome: "ASSISTANCE_PROVIDED", resolvedById: "2", resolvedByName: "Brian Mwangi",
    resolvedAt: "2026-08-18T00:10:00.000Z", archived: false,
    createdAt: "2026-08-17T16:10:00.000Z", updatedAt: "2026-08-18T00:10:00.000Z",
  },
  {
    id: "6", reference: "AJL-0006", title: "False smoke report at mall",
    description: "Security confirmed the visible smoke came from scheduled generator maintenance.",
    type: "fire", urgency: "LOW", severity: "MINOR", status: "CLOSED",
    location: "Westlands, Nairobi", lat: -1.2674, lng: 36.8108, userId: "1",
    reporterName: "Amina Otieno", reporterEmail: "amina@ajalihq.test",
    preferredContactMethod: "PHONE", verificationId: "ver-6",
    closeReasonCode: "FALSE_REPORT", archived: false,
    createdAt: "2026-08-18T09:15:00.000Z", updatedAt: "2026-08-18T09:48:00.000Z",
  },
  {
    id: "7", reference: "AJL-0007", title: "Overturned lorry on Uganda Road",
    description: "An overturned lorry is blocking the Eldoret-bound carriageway.",
    type: "accident", urgency: "HIGH", severity: "MODERATE", status: "VERIFIED",
    location: "Uganda Road, Eldoret", lat: 0.5143, lng: 35.2698, userId: "4",
    reporterName: "Daniel Kipchoge", reporterEmail: "daniel@ajalihq.test",
    preferredContactMethod: "PHONE", verificationId: "ver-7", archived: false,
    createdAt: "2026-08-19T14:20:00.000Z", updatedAt: "2026-08-19T14:50:00.000Z",
  },
  {
    id: "8", reference: "AJL-0008", title: "Unconfirmed distress call",
    description: "A caller reported shouting and broken glass but could not provide coordinates.",
    type: "crime", urgency: "MEDIUM", severity: "MODERATE", status: "PENDING",
    location: "Nakuru town", lat: null, lng: null, userId: "6",
    reporterName: "Hassan Ali", reporterPhone: "+254755666777",
    preferredContactMethod: "PHONE", archived: false,
    createdAt: "2026-08-20T08:04:00.000Z", updatedAt: "2026-08-20T08:04:00.000Z",
  },
  {
    id: "9", reference: "AJL-0009", title: "Building collapse response",
    description: "A partial wall collapse injured two workers; the site has been secured.",
    type: "disaster", urgency: "HIGH", severity: "CRITICAL", status: "RESOLVED",
    location: "Kisauni, Mombasa", lat: -4.0203, lng: 39.6953, userId: "6",
    reporterName: "Hassan Ali", reporterEmail: "hassan@ajalihq.test",
    preferredContactMethod: "PHONE", verificationId: "ver-9",
    resolutionSummary: "Site secured; injured workers treated at hospital.",
    resolutionOutcome: "RESOLVED", resolvedById: "5", resolvedByName: "Faith Njeri",
    resolvedAt: "2026-08-16T13:00:00.000Z", archived: false,
    createdAt: "2026-08-15T10:00:00.000Z", updatedAt: "2026-08-16T13:00:00.000Z",
  },
  {
    id: "10", reference: "AJL-0010", title: "Minor collision near Milimani",
    description: "A low-speed collision caused no injuries and vehicles were moved.",
    type: "accident", urgency: "LOW", severity: "MINOR", status: "CLOSED",
    location: "Milimani, Kisumu", lat: -0.1097, lng: 34.7538, userId: "3",
    reporterName: "Grace Wanjiku", reporterEmail: "grace@ajalihq.test",
    preferredContactMethod: "EMAIL", closeReasonCode: "DUPLICATE", archived: false,
    createdAt: "2026-08-14T11:15:00.000Z", updatedAt: "2026-08-14T12:00:00.000Z",
  },
  {
    id: "11", reference: "AJL-0011", title: "Person requiring medical assistance",
    description: "A caller reports an unresponsive person but disconnected before sharing a location.",
    type: "medical", urgency: "CRITICAL", severity: "MAJOR", status: "PENDING",
    location: "Location unavailable", lat: null, lng: null, userId: "1",
    reporterName: "Amina Otieno", reporterEmail: "amina@ajalihq.test",
    preferredContactMethod: "PHONE", archived: false,
    createdAt: "2026-08-20T08:35:00.000Z", updatedAt: "2026-08-20T08:35:00.000Z",
  },
  {
    id: "12", reference: "AJL-0012", title: "Archived duplicate road report",
    description: "Duplicate of a previously resolved report about debris on the highway.",
    type: "accident", urgency: "LOW", severity: "MINOR", status: "CLOSED",
    location: "Naivasha Road, Nakuru", lat: -0.7172, lng: 36.4310, userId: "4",
    reporterName: "Daniel Kipchoge", closeReasonCode: "DUPLICATE",
    archived: true, archiveReason: "Duplicate report",
    createdAt: "2026-08-12T09:00:00.000Z", updatedAt: "2026-08-12T10:00:00.000Z",
  },
]

const verifications: ReporterVerification[] = [
  {
    id: "ver-2", incidentId: "2", status: "VERIFIED", method: "PHONE",
    notes: "Reporter confirmed active fire at Gikomba stalls.",
    verifiedById: "2", verifiedByName: "Brian Mwangi",
    verifiedAt: "2026-08-20T05:22:00.000Z",
    createdAt: "2026-08-20T05:20:00.000Z", updatedAt: "2026-08-20T05:22:00.000Z",
  },
  {
    id: "ver-3", incidentId: "3", status: "VERIFIED", method: "PHONE",
    notes: "Reporter confirmed flooding and blocked access.",
    verifiedById: "5", verifiedByName: "Faith Njeri",
    verifiedAt: "2026-08-19T16:00:00.000Z",
    createdAt: "2026-08-19T15:50:00.000Z", updatedAt: "2026-08-19T16:00:00.000Z",
  },
  {
    id: "ver-4", incidentId: "4", status: "VERIFIED", method: "PHONE",
    notes: "Witness at ferry confirmed medical emergency.",
    verifiedById: "2", verifiedByName: "Brian Mwangi",
    verifiedAt: "2026-08-20T07:20:00.000Z",
    createdAt: "2026-08-20T07:18:00.000Z", updatedAt: "2026-08-20T07:20:00.000Z",
  },
  {
    id: "ver-5", incidentId: "5", status: "VERIFIED", method: "EMAIL",
    notes: "Shop owner confirmed via email.",
    verifiedById: "2", verifiedByName: "Brian Mwangi",
    verifiedAt: "2026-08-17T17:00:00.000Z",
    createdAt: "2026-08-17T16:50:00.000Z", updatedAt: "2026-08-17T17:00:00.000Z",
  },
  {
    id: "ver-6", incidentId: "6", status: "FAILED", method: "PHONE",
    notes: "Mall security confirmed false alarm.",
    verifiedById: "2", verifiedByName: "Brian Mwangi",
    verifiedAt: "2026-08-18T09:48:00.000Z",
    createdAt: "2026-08-18T09:30:00.000Z", updatedAt: "2026-08-18T09:48:00.000Z",
  },
  {
    id: "ver-7", incidentId: "7", status: "VERIFIED", method: "PHONE",
    notes: "Caller confirmed overturned lorry and traffic block.",
    verifiedById: "5", verifiedByName: "Faith Njeri",
    verifiedAt: "2026-08-19T14:50:00.000Z",
    createdAt: "2026-08-19T14:40:00.000Z", updatedAt: "2026-08-19T14:50:00.000Z",
  },
  {
    id: "ver-9", incidentId: "9", status: "VERIFIED", method: "OTHER",
    notes: "Site foreman confirmed collapse.",
    verifiedById: "5", verifiedByName: "Faith Njeri",
    verifiedAt: "2026-08-15T10:30:00.000Z",
    createdAt: "2026-08-15T10:20:00.000Z", updatedAt: "2026-08-15T10:30:00.000Z",
  },
]

const handoffs: DepartmentHandoff[] = [
  {
    id: "hand-3a", incidentId: "3", departmentId: "dept-4", initiatedById: "5",
    initiatedByName: "Faith Njeri", status: "IN_PROGRESS",
    notes: "County disaster team coordinating evacuation.",
    handedOffAt: "2026-08-20T04:30:00.000Z", acknowledgedAt: "2026-08-20T04:40:00.000Z",
    updatedAt: "2026-08-20T04:40:00.000Z",
  },
  {
    id: "hand-3b", incidentId: "3", departmentId: "dept-5", initiatedById: "5",
    initiatedByName: "Faith Njeri", status: "ACKNOWLEDGED",
    notes: "Shelter support requested.",
    handedOffAt: "2026-08-20T04:30:00.000Z", acknowledgedAt: "2026-08-20T04:55:00.000Z",
    updatedAt: "2026-08-20T04:55:00.000Z",
  },
  {
    id: "hand-4a", incidentId: "4", departmentId: "dept-3", initiatedById: "2",
    initiatedByName: "Brian Mwangi", status: "IN_PROGRESS",
    notes: "Ambulance en route to Likoni.",
    handedOffAt: "2026-08-20T07:27:00.000Z", acknowledgedAt: "2026-08-20T07:30:00.000Z",
    updatedAt: "2026-08-20T07:30:00.000Z",
  },
  {
    id: "hand-5a", incidentId: "5", departmentId: "dept-1", initiatedById: "2",
    initiatedByName: "Brian Mwangi", status: "COMPLETED",
    notes: "Police completed scene response.",
    handedOffAt: "2026-08-17T18:00:00.000Z", acknowledgedAt: "2026-08-17T18:10:00.000Z",
    completedAt: "2026-08-18T00:05:00.000Z", updatedAt: "2026-08-18T00:05:00.000Z",
  },
  {
    id: "hand-9a", incidentId: "9", departmentId: "dept-2", initiatedById: "5",
    initiatedByName: "Faith Njeri", status: "COMPLETED",
    notes: "Rescue completed; site secured.",
    handedOffAt: "2026-08-15T11:00:00.000Z", acknowledgedAt: "2026-08-15T11:15:00.000Z",
    completedAt: "2026-08-16T12:30:00.000Z", updatedAt: "2026-08-16T12:30:00.000Z",
  },
  {
    id: "hand-9b", incidentId: "9", departmentId: "dept-3", initiatedById: "5",
    initiatedByName: "Faith Njeri", status: "COMPLETED",
    notes: "Casualties transported.",
    handedOffAt: "2026-08-15T11:00:00.000Z", acknowledgedAt: "2026-08-15T11:20:00.000Z",
    completedAt: "2026-08-16T12:00:00.000Z", updatedAt: "2026-08-16T12:00:00.000Z",
  },
]

const statusHistory: StatusHistory[] = incidents.flatMap((incident, index) => {
  const created: StatusHistory = {
    id: `history-${index + 1}-created`, incidentId: incident.id, fromStatus: null,
    toStatus: "PENDING", actorId: incident.userId, actorName: incident.reporterName ?? "Citizen",
    reason: "Incident reported", createdAt: incident.createdAt,
  }
  if (incident.status === "PENDING") return [created]
  const verified: StatusHistory = {
    id: `history-${index + 1}-verified`, incidentId: incident.id, fromStatus: "PENDING",
    toStatus: incident.status === "CLOSED" ? "CLOSED" : "VERIFIED", actorId: "2",
    actorName: "Brian Mwangi",
    reason: incident.status === "CLOSED" ? "Report invalid or duplicate" : "Report confirmed with reporter",
    createdAt: incident.updatedAt,
  }
  if (incident.status === "VERIFIED" || incident.status === "CLOSED") return [created, verified]
  const started: StatusHistory = {
    id: `history-${index + 1}-started`, incidentId: incident.id, fromStatus: "VERIFIED",
    toStatus: "IN_PROGRESS", actorId: "2", actorName: "Brian Mwangi",
    reason: "Response started with department handoff", createdAt: incident.updatedAt,
  }
  if (incident.status === "IN_PROGRESS") return [created, verified, started]
  return [
    created, verified, started,
    {
      id: `history-${index + 1}-resolved`, incidentId: incident.id, fromStatus: "IN_PROGRESS",
      toStatus: "RESOLVED", actorId: "5", actorName: "Faith Njeri",
      reason: "Response completed", createdAt: incident.updatedAt,
    },
  ]
})

const auditLogs: AuditLog[] = statusHistory
  .filter((item) => item.fromStatus !== null)
  .map((item) => ({
    id: `audit-${item.id}`, incidentId: item.incidentId, actorId: item.actorId,
    actorName: item.actorName,
    action:
      item.toStatus === "VERIFIED" ? "REPORT_VERIFIED"
        : item.toStatus === "CLOSED" ? "REPORT_CLOSED"
          : item.toStatus === "IN_PROGRESS" ? "RESPONSE_STARTED"
            : item.toStatus === "RESOLVED" ? "INCIDENT_RESOLVED"
              : `STATUS_${item.toStatus}`,
    previousValue: item.fromStatus ?? undefined, newValue: item.toStatus,
    reason: item.reason, createdAt: item.createdAt,
  }))

const seed: Database = {
  users,
  incidents,
  departments,
  verifications,
  handoffs,
  media: [
    { id: "media-1", incidentId: "2", kind: "image", url: "/splash.png", name: "gikomba-smoke.jpg", createdAt: "2026-08-20T05:08:00.000Z" },
    { id: "media-2", incidentId: "3", kind: "video", url: "/icons.svg", name: "kaptembwo-flooding.mp4", createdAt: "2026-08-19T15:15:00.000Z" },
    { id: "media-3", incidentId: "9", kind: "image", url: "/logo.png", name: "secured-site.jpg", createdAt: "2026-08-15T10:12:00.000Z" },
  ],
  notes: [
    { id: "note-1", incidentId: "2", authorId: "2", authorName: "Brian Mwangi", body: "County fire service has acknowledged dispatch.", createdAt: "2026-08-20T05:25:00.000Z" },
    { id: "note-2", incidentId: "3", authorId: "5", authorName: "Faith Njeri", body: "Evacuation point established at the nearby school.", createdAt: "2026-08-20T04:35:00.000Z" },
  ],
  statusHistory,
  auditLogs,
  notifications: [
    { id: "notification-1", incidentId: "2", type: "REPORT_VERIFIED", channel: "IN_APP", title: "Report verified", body: "AJL-0002 was verified by Brian Mwangi.", read: false, createdAt: "2026-08-20T05:22:00.000Z" },
    { id: "notification-2", incidentId: "3", type: "RESPONSE_STARTED", channel: "IN_APP", title: "Response started", body: "AJL-0003 is now in progress.", read: false, createdAt: "2026-08-20T04:30:00.000Z" },
    { id: "notification-3", incidentId: "4", type: "DEPARTMENT_ASSIGNED", channel: "SMS", title: "Department assigned", body: "Ambulance assigned to AJL-0004.", read: true, createdAt: "2026-08-20T07:27:00.000Z" },
    { id: "notification-4", incidentId: "11", type: "REPORT_RECEIVED", channel: "IN_APP", title: "Critical urgency report", body: "AJL-0011 requires immediate attention.", read: false, createdAt: "2026-08-20T08:35:00.000Z" },
  ],
}

type Stored = Database & { version: number }

function clone<T>(value: T): T {
  return structuredClone(value)
}

function readStored(): Database {
  if (typeof localStorage === "undefined") return clone(seed)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(seed)
    const stored = JSON.parse(raw) as Stored
    if (
      stored.version !== STORAGE_VERSION ||
      !Array.isArray(stored.users) ||
      !Array.isArray(stored.incidents) ||
      !Array.isArray(stored.departments) ||
      !Array.isArray(stored.verifications) ||
      !Array.isArray(stored.handoffs) ||
      !Array.isArray(stored.statusHistory)
    ) {
      return clone(seed)
    }
    return clone(stored)
  } catch {
    return clone(seed)
  }
}

let db = readStored()
let idSequence = 0

function persist() {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, ...db } satisfies Stored)
  )
}

function wait(ms = 35) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function nextId(prefix: string) {
  idSequence += 1
  return `${prefix}-${Date.now()}-${idSequence}`
}

function getRequiredIncident(id: string): Incident {
  const incident = db.incidents.find((item) => item.id === id)
  if (!incident) throw new Error(`Incident ${id} was not found.`)
  return incident
}

function getRequiredDepartment(id: string): Department {
  const department = db.departments.find((item) => item.id === id)
  if (!department) throw new Error(`Department ${id} was not found.`)
  return department
}

function nextReference() {
  const highest = db.incidents.reduce((max, item) => {
    const value = Number(item.reference.match(/^AJL-(\d+)$/)?.[1] ?? 0)
    return Math.max(max, value)
  }, 0)
  return `AJL-${String(highest + 1).padStart(4, "0")}`
}

function addAudit(entry: Omit<AuditLog, "id" | "createdAt" | "incidentReference">, createdAt: string) {
  const incidentReference = entry.incidentId
    ? db.incidents.find((item) => item.id === entry.incidentId)?.reference
    : undefined
  db.auditLogs.push({
    id: nextId("audit"),
    createdAt,
    incidentReference,
    ...entry,
  })
}

function durableMediaUrl(kind: IncidentMedia["kind"], url: string) {
  if (url.startsWith("blob:")) return kind === "video" ? "/icons.svg" : "/splash.png"
  return url
}

function latestVerificationStatus(incidentId: string): VerificationStatus {
  const list = db.verifications
    .filter((item) => item.incidentId === incidentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return list[0]?.status ?? "PENDING"
}

function toListItem(incident: Incident): IncidentListItem {
  return { ...incident, verificationStatus: latestVerificationStatus(incident.id) }
}

function addNotification(
  incident: Incident,
  type: string,
  title: string,
  body: string,
  createdAt: string,
  channel: AppNotification["channel"] = "IN_APP"
) {
  db.notifications.push({
    id: nextId("notification"), incidentId: incident.id, type, channel,
    title, body, read: false, createdAt,
  })
}

function pushStatusHistory(
  incidentId: string,
  fromStatus: IncidentStatus | null,
  toStatus: IncidentStatus,
  actor: Actor,
  reason: string | undefined,
  createdAt: string
) {
  db.statusHistory.push({
    id: nextId("history"), incidentId, fromStatus, toStatus,
    actorId: actor.id, actorName: actor.name, reason, createdAt,
  })
}

async function transitionIncident(
  id: string,
  toStatus: IncidentStatus,
  reason: string,
  actor: Actor,
  extras?: Partial<Incident>,
  auditAction?: string
): Promise<Incident> {
  await wait()
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot change status.")
  if (!canTransition(current.status, toStatus)) {
    throw new Error(`Cannot transition ${current.status} to ${toStatus}.`)
  }
  const createdAt = new Date().toISOString()
  const updated: Incident = {
    ...current,
    ...extras,
    status: toStatus,
    updatedAt: createdAt,
  }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  pushStatusHistory(id, current.status, toStatus, actor, reason.trim() || undefined, createdAt)
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: auditAction ?? `STATUS_${toStatus}`,
    previousValue: current.status, newValue: toStatus,
    reason: reason.trim() || undefined,
  }, createdAt)
  addNotification(
    updated,
    auditAction ?? `STATUS_${toStatus}`,
    `Incident ${statusLabel(toStatus).toLowerCase()}`,
    `${updated.reference} moved from ${statusLabel(current.status)} to ${statusLabel(toStatus)}.`,
    createdAt
  )
  persist()
  return clone(updated)
}

/* ─── Users ─── */

export async function apiGetUsers(email?: string): Promise<UserRecord[]> {
  await wait()
  const list = db.users.map((user) => ({ ...user, role: normalizeRole(user.role) }))
  if (!email) return clone(list)
  const normalized = email.trim().toLowerCase()
  return clone(list.filter((user) => user.email.toLowerCase() === normalized))
}

export async function apiAuthenticate(email: string): Promise<UserRecord | null> {
  const matches = await apiGetUsers(email)
  return matches[0] ?? null
}

export async function apiCreateUser(input: {
  name: string
  email: string
  phone?: string
  role?: Role
  avatarUrl?: string
  location?: string
  bio?: string
  preferredContactMethod?: UserRecord["preferredContactMethod"]
}): Promise<UserRecord> {
  await wait()
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = db.users.find((user) => user.email.toLowerCase() === normalizedEmail)
  if (existing) return clone({ ...existing, role: normalizeRole(existing.role) })
  const phone = input.phone?.trim() || undefined
  const user: UserRecord = {
    id: nextId("user"),
    name: input.name.trim(),
    email: normalizedEmail,
    phone,
    role: normalizeRole(input.role ?? "USER"),
    avatarUrl: input.avatarUrl,
    location: input.location?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    preferredContactMethod: input.preferredContactMethod ?? "PHONE",
    profileComplete: Boolean(input.name.trim() && phone),
  }
  db.users.push(user)
  persist()
  return clone(user)
}

export async function apiGetUser(id: string): Promise<UserRecord | null> {
  await wait()
  const user = db.users.find((item) => item.id === id)
  return user ? clone({ ...user, role: normalizeRole(user.role) }) : null
}

export type UpdateUserPatch = Partial<
  Pick<
    UserRecord,
    | "name"
    | "phone"
    | "avatarUrl"
    | "location"
    | "bio"
    | "preferredContactMethod"
  >
>

export async function apiUpdateUser(
  id: string,
  patch: UpdateUserPatch
): Promise<UserRecord> {
  await wait()
  const index = db.users.findIndex((item) => item.id === id)
  if (index === -1) throw new Error(`User ${id} was not found.`)
  const current = db.users[index]
  const next: UserRecord = {
    ...current,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    phone:
      patch.phone !== undefined
        ? patch.phone.trim() || undefined
        : current.phone,
    avatarUrl:
      patch.avatarUrl !== undefined ? patch.avatarUrl || undefined : current.avatarUrl,
    location:
      patch.location !== undefined
        ? patch.location.trim() || undefined
        : current.location,
    bio: patch.bio !== undefined ? patch.bio.trim() || undefined : current.bio,
    preferredContactMethod:
      patch.preferredContactMethod ?? current.preferredContactMethod ?? "PHONE",
  }
  next.profileComplete = Boolean(next.name.trim() && next.phone)
  next.role = normalizeRole(next.role)
  db.users[index] = next
  persist()
  return clone(next)
}

/* ─── Incidents ─── */

export async function apiGetIncidents(
  options?: IncidentListQuery
): Promise<IncidentListItem[]> {
  await wait()
  let list = db.incidents.filter((item) => options?.includeArchived || !item.archived)
  if (options?.userId) list = list.filter((item) => item.userId === options.userId)
  if (options?.status) {
    list = list.filter((item) => item.status === options.status)
  } else if (options?.statusIn?.length) {
    const allowed = new Set(options.statusIn)
    list = list.filter((item) => allowed.has(item.status))
  }
  if (options?.urgency) list = list.filter((item) => item.urgency === options.urgency)
  if (options?.severity) list = list.filter((item) => item.severity === options.severity)
  if (options?.type) list = list.filter((item) => item.type === options.type)
  if (options?.location) {
    const loc = options.location.trim().toLowerCase()
    list = list.filter((item) => item.location.toLowerCase().includes(loc))
  }
  if (options?.search) {
    const q = options.search.trim().toLowerCase()
    list = list.filter(
      (item) =>
        item.reference.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.reporterName ?? "").toLowerCase().includes(q)
    )
  }
  if (options?.dateFrom) {
    list = list.filter((item) => item.createdAt >= options.dateFrom!)
  }
  if (options?.dateTo) {
    const end = options.dateTo.includes("T") ? options.dateTo : `${options.dateTo}T23:59:59.999Z`
    list = list.filter((item) => item.createdAt <= end)
  }
  if (options?.departmentId) {
    const ids = new Set(
      db.handoffs
        .filter((h) => h.departmentId === options.departmentId)
        .map((h) => h.incidentId)
    )
    list = list.filter((item) => ids.has(item.id))
  }
  let items = list.map(toListItem)
  if (options?.verificationStatus) {
    items = items.filter((item) => item.verificationStatus === options.verificationStatus)
  }
  if (options?.sort === "newest") {
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } else {
    items.sort(compareByUrgencyThenNewest)
  }
  return clone(items)
}

export async function apiGetIncident(id: string): Promise<Incident | null> {
  await wait()
  const incident = db.incidents.find((item) => item.id === id)
  return incident ? clone(incident) : null
}

export async function apiGetActiveIncidents(): Promise<Incident[]> {
  await wait()
  return clone(
    db.incidents
      .filter((item) => item.status === "IN_PROGRESS" && !item.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  )
}

export async function apiCreateIncident(
  input: CreateIncidentInput,
  actor: Actor
): Promise<Incident> {
  await wait()
  const now = new Date().toISOString()
  const reporter = db.users.find((user) => user.id === input.userId)
  const incident: Incident = {
    id: nextId("incident"), reference: nextReference(), title: input.title.trim(),
    description: input.description.trim(), type: input.type ?? "accident",
    urgency: input.urgency ?? "MEDIUM", severity: input.severity ?? "MODERATE",
    status: "PENDING", location: input.location.trim(),
    lat: input.lat ?? null, lng: input.lng ?? null, userId: input.userId,
    reporterName: input.reporterName?.trim() || reporter?.name,
    reporterEmail: input.reporterEmail?.trim() || reporter?.email,
    reporterPhone: input.reporterPhone?.trim() || reporter?.phone,
    preferredContactMethod: input.preferredContactMethod ?? "PHONE",
    archived: false, createdAt: now, updatedAt: now,
  }
  db.incidents.push(incident)
  pushStatusHistory(incident.id, null, "PENDING", actor, "Incident created", now)
  addAudit({
    incidentId: incident.id, actorId: actor.id, actorName: actor.name,
    action: "REPORT_CREATED", newValue: "PENDING",
  }, now)
  addNotification(
    incident,
    incident.urgency === "CRITICAL" ? "CRITICAL_REPORT_RECEIVED" : "REPORT_RECEIVED",
    incident.urgency === "CRITICAL" ? "Critical urgency report received" : "New report received",
    `${incident.reference}: ${incident.title}`,
    now
  )
  if (input.media?.length) {
    for (const item of input.media) {
      db.media.push({
        id: nextId("media"), incidentId: incident.id, kind: item.kind,
        url: durableMediaUrl(item.kind, item.url), name: item.name.trim(), createdAt: now,
      })
      addAudit({
        incidentId: incident.id, actorId: actor.id, actorName: actor.name,
        action: "MEDIA_ADDED", newValue: item.name.trim(),
      }, now)
    }
  }
  persist()
  return clone(incident)
}

export async function apiUpdateIncident(
  id: string,
  patch: UpdateIncidentPatch,
  actor: Actor
): Promise<Incident> {
  await wait()
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot be edited.")
  const now = new Date().toISOString()
  const cleaned = Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  ) as UpdateIncidentPatch
  const updated: Incident = { ...current, ...cleaned, status: current.status, updatedAt: now }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "REPORT_UPDATED", previousValue: JSON.stringify(current),
    newValue: JSON.stringify(updated),
  }, now)
  persist()
  return clone(updated)
}

export async function apiArchiveIncident(
  id: string,
  reason: string,
  actor: Actor
): Promise<Incident> {
  await wait()
  if (!reason.trim()) throw new Error("An archive reason is required.")
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Incident is already archived.")
  const now = new Date().toISOString()
  const updated = { ...current, archived: true, archiveReason: reason.trim(), updatedAt: now }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "INCIDENT_ARCHIVED", previousValue: "false", newValue: "true", reason: reason.trim(),
  }, now)
  addNotification(updated, "INCIDENT_ARCHIVED", "Incident archived", `${updated.reference} was archived.`, now)
  persist()
  return clone(updated)
}

export async function apiVerifyIncident(
  id: string,
  input: VerifyIncidentInput,
  actor: Actor
): Promise<Incident> {
  await wait()
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot change status.")
  if (!canTransition(current.status, "VERIFIED")) {
    throw new Error(`Cannot transition ${current.status} to VERIFIED.`)
  }
  const now = new Date().toISOString()
  const verification: ReporterVerification = {
    id: nextId("ver"), incidentId: id, status: "VERIFIED", method: input.method,
    notes: input.notes?.trim() || undefined, verifiedById: actor.id, verifiedByName: actor.name,
    verifiedAt: now, createdAt: now, updatedAt: now,
  }
  db.verifications.push(verification)
  const updated: Incident = {
    ...current, status: "VERIFIED", verificationId: verification.id, updatedAt: now,
  }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  pushStatusHistory(
    id, current.status, "VERIFIED", actor,
    input.notes?.trim() || `Verified via ${input.method}`, now
  )
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "REPORT_VERIFIED", previousValue: current.status, newValue: "VERIFIED",
    reason: input.notes?.trim(),
    metadata: JSON.stringify({ method: input.method, verificationId: verification.id }),
  }, now)
  addNotification(
    updated, "REPORT_VERIFIED", "Report verified",
    `${updated.reference} verified via ${input.method}.`, now
  )
  persist()
  return clone(updated)
}

export async function apiCloseIncident(
  id: string,
  input: CloseIncidentInput,
  actor: Actor
): Promise<Incident> {
  await wait()
  if (!input.reason.trim()) throw new Error("A close reason is required.")
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot change status.")
  if (!canTransition(current.status, "CLOSED")) {
    throw new Error(`Cannot transition ${current.status} to CLOSED.`)
  }
  const now = new Date().toISOString()
  let verificationId = current.verificationId
  if (input.failVerification || current.status === "PENDING") {
    const verification: ReporterVerification = {
      id: nextId("ver"), incidentId: id, status: "FAILED", method: "OTHER",
      notes: input.reason.trim(), verifiedById: actor.id, verifiedByName: actor.name,
      verifiedAt: now, createdAt: now, updatedAt: now,
    }
    db.verifications.push(verification)
    verificationId = verification.id
  }
  const updated: Incident = {
    ...current,
    status: "CLOSED",
    verificationId,
    closeReasonCode: input.reasonCode ?? "OTHER",
    updatedAt: now,
  }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  pushStatusHistory(id, current.status, "CLOSED", actor, input.reason.trim(), now)
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "REPORT_CLOSED", previousValue: current.status, newValue: "CLOSED",
    reason: input.reason.trim(),
    metadata: JSON.stringify({ reasonCode: updated.closeReasonCode }),
  }, now)
  addNotification(
    updated, "REPORT_CLOSED", "Report closed",
    `${updated.reference} closed: ${input.reason.trim()}.`, now
  )
  persist()
  return clone(updated)
}

export async function apiStartResponse(
  id: string,
  input: StartResponseInput,
  actor: Actor
): Promise<Incident> {
  await wait()
  if (!input.departmentIds.length) {
    throw new Error("Select at least one department to start response.")
  }
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot change status.")
  if (!canTransition(current.status, "IN_PROGRESS")) {
    throw new Error(`Cannot transition ${current.status} to IN_PROGRESS.`)
  }
  const now = new Date().toISOString()
  const uniqueDeptIds = [...new Set(input.departmentIds)]
  for (const departmentId of uniqueDeptIds) {
    const department = getRequiredDepartment(departmentId)
    if (!department.active) throw new Error(`${department.name} is inactive.`)
    const handoff: DepartmentHandoff = {
      id: nextId("hand"), incidentId: id, departmentId,
      initiatedById: actor.id, initiatedByName: actor.name, status: "PENDING",
      notes: input.notes?.trim() || undefined, handedOffAt: now, updatedAt: now,
    }
    db.handoffs.push(handoff)
    addAudit({
      incidentId: id, actorId: actor.id, actorName: actor.name,
      action: "DEPARTMENT_ASSIGNED", newValue: department.name,
      reason: input.notes?.trim(),
      metadata: JSON.stringify({ handoffId: handoff.id, departmentId }),
    }, now)
    addNotification(
      current, "DEPARTMENT_ASSIGNED", "Department assigned",
      `${department.name} assigned to ${current.reference}.`, now, "EMAIL"
    )
  }
  const updated: Incident = { ...current, status: "IN_PROGRESS", updatedAt: now }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  pushStatusHistory(
    id, current.status, "IN_PROGRESS", actor,
    input.notes?.trim() || "Response started", now
  )
  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "RESPONSE_STARTED", previousValue: current.status, newValue: "IN_PROGRESS",
    reason: input.notes?.trim(),
    metadata: JSON.stringify({ departmentIds: uniqueDeptIds }),
  }, now)
  addNotification(
    updated, "RESPONSE_STARTED", "Response started",
    `${updated.reference} is now in progress.`, now
  )
  persist()
  return clone(updated)
}

export async function apiResolveIncident(
  id: string,
  input: ResolveIncidentInput,
  actor: Actor
): Promise<Incident> {
  await wait()
  if (!input.summary.trim()) throw new Error("A resolution summary is required.")
  const current = getRequiredIncident(id)
  if (current.archived) throw new Error("Archived incidents cannot change status.")
  if (!canTransition(current.status, "RESOLVED")) {
    throw new Error(`Cannot transition ${current.status} to RESOLVED.`)
  }
  const now = new Date().toISOString()
  const complete = input.completeHandoffs !== false
  if (complete) {
    db.handoffs = db.handoffs.map((handoff) => {
      if (handoff.incidentId !== id || handoff.status === "COMPLETED" || handoff.status === "CANCELLED") {
        return handoff
      }
      return {
        ...handoff,
        status: "COMPLETED" as const,
        completedAt: now,
        updatedAt: now,
      }
    })
  }
  const updated: Incident = {
    ...current,
    status: "RESOLVED",
    resolutionSummary: input.summary.trim(),
    resolutionNotes: input.notes?.trim() || undefined,
    resolutionOutcome: input.outcome,
    resolvedById: actor.id,
    resolvedByName: actor.name,
    resolvedAt: now,
    updatedAt: now,
  }
  db.incidents = db.incidents.map((item) => (item.id === id ? updated : item))
  pushStatusHistory(id, current.status, "RESOLVED", actor, input.summary.trim(), now)

  const notifySms = Boolean(input.notifyCitizen?.sms)
  const notifyEmail = Boolean(input.notifyCitizen?.email)
  const citizenChannels = [
    ...(notifySms ? (["SMS"] as const) : []),
    ...(notifyEmail ? (["EMAIL"] as const) : []),
  ]

  addAudit({
    incidentId: id, actorId: actor.id, actorName: actor.name,
    action: "INCIDENT_RESOLVED", previousValue: current.status, newValue: "RESOLVED",
    reason: input.summary.trim(),
    metadata: JSON.stringify({
      outcome: input.outcome,
      notifyCitizen: { sms: notifySms, email: notifyEmail },
    }),
  }, now)
  addNotification(
    updated, "INCIDENT_RESOLVED", "Incident resolved",
    `${updated.reference} marked resolved.`, now
  )

  const citizenBody =
    `Your report ${updated.reference} has been resolved. ` +
    `${input.summary.trim()}` +
    (updated.reporterName ? ` - Ajali! Operations` : "")

  for (const channel of citizenChannels) {
    const destination =
      channel === "SMS"
        ? updated.reporterPhone || "no phone on file"
        : updated.reporterEmail || "no email on file"
    addNotification(
      updated,
      "CITIZEN_STATUS_NOTIFY",
      `Citizen notified (${channel})`,
      `Queued ${channel} to ${destination}: ${citizenBody}`,
      now,
      channel
    )
    addAudit({
      incidentId: id, actorId: actor.id, actorName: actor.name,
      action: "CITIZEN_NOTIFIED",
      newValue: channel,
      reason: `Resolution status notified via ${channel}`,
      metadata: JSON.stringify({ destination, channel }),
    }, now)
  }

  persist()
  return clone(updated)
}

export async function apiReopenIncident(id: string, reason: string, actor: Actor) {
  const incident = getRequiredIncident(id)
  if (incident.status === "RESOLVED") {
    return transitionIncident(id, "IN_PROGRESS", reason, actor, undefined, "INCIDENT_REOPENED")
  }
  if (incident.status === "CLOSED") {
    return transitionIncident(id, "PENDING", reason, actor, {
      closeReasonCode: undefined,
      verificationId: undefined,
    }, "INCIDENT_REOPENED")
  }
  throw new Error(`Cannot reopen an incident with status ${incident.status}.`)
}

/* ─── Verification ─── */

export async function apiGetVerification(
  incidentId: string
): Promise<ReporterVerification | null> {
  await wait()
  const list = db.verifications
    .filter((item) => item.incidentId === incidentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return list[0] ? clone(list[0]) : null
}

export async function apiGetVerifications(
  incidentId: string
): Promise<ReporterVerification[]> {
  await wait()
  return clone(
    db.verifications
      .filter((item) => item.incidentId === incidentId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  )
}

/* ─── Departments ─── */

export async function apiGetDepartments(options?: {
  activeOnly?: boolean
}): Promise<Department[]> {
  await wait()
  let list = [...db.departments]
  if (options?.activeOnly) list = list.filter((item) => item.active)
  return clone(list.sort((a, b) => a.name.localeCompare(b.name)))
}

export async function apiGetDepartment(id: string): Promise<Department | null> {
  await wait()
  const department = db.departments.find((item) => item.id === id)
  return department ? clone(department) : null
}

export async function apiCreateDepartment(
  input: CreateDepartmentInput,
  actor: Actor
): Promise<Department> {
  await wait()
  if (!input.name.trim()) throw new Error("Department name is required.")
  const now = new Date().toISOString()
  const department: Department = {
    id: nextId("dept"),
    name: input.name.trim(),
    type: input.type,
    description: input.description?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    location: input.location?.trim() || undefined,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  }
  db.departments.push(department)
  addAudit({
    actorId: actor.id, actorName: actor.name, action: "DEPARTMENT_CREATED",
    newValue: department.name, metadata: JSON.stringify({ departmentId: department.id }),
  }, now)
  persist()
  return clone(department)
}

export async function apiUpdateDepartment(
  id: string,
  patch: UpdateDepartmentPatch,
  actor: Actor
): Promise<Department> {
  await wait()
  const current = getRequiredDepartment(id)
  const now = new Date().toISOString()
  const updated: Department = {
    ...current,
    name: patch.name?.trim() ?? current.name,
    type: patch.type ?? current.type,
    description: patch.description !== undefined
      ? patch.description.trim() || undefined
      : current.description,
    phone: patch.phone !== undefined ? patch.phone.trim() || undefined : current.phone,
    email: patch.email !== undefined ? patch.email.trim() || undefined : current.email,
    location: patch.location !== undefined
      ? patch.location.trim() || undefined
      : current.location,
    active: patch.active ?? current.active,
    updatedAt: now,
  }
  db.departments = db.departments.map((item) => (item.id === id ? updated : item))
  addAudit({
    actorId: actor.id, actorName: actor.name, action: "DEPARTMENT_UPDATED",
    previousValue: current.name, newValue: updated.name,
    metadata: JSON.stringify({ departmentId: id }),
  }, now)
  persist()
  return clone(updated)
}

export async function apiSetDepartmentActive(
  id: string,
  active: boolean,
  actor: Actor
): Promise<Department> {
  return apiUpdateDepartment(id, { active }, actor)
}

/* ─── Handoffs ─── */

export async function apiGetHandoffs(incidentId: string): Promise<DepartmentHandoff[]> {
  await wait()
  return clone(
    db.handoffs
      .filter((item) => item.incidentId === incidentId)
      .sort((a, b) => a.handedOffAt.localeCompare(b.handedOffAt))
  )
}

export async function apiGetAllHandoffs(): Promise<DepartmentHandoff[]> {
  await wait()
  return clone([...db.handoffs].sort((a, b) => b.handedOffAt.localeCompare(a.handedOffAt)))
}

export async function apiUpdateHandoff(
  id: string,
  input: UpdateHandoffInput,
  actor: Actor
): Promise<DepartmentHandoff> {
  await wait()
  const current = db.handoffs.find((item) => item.id === id)
  if (!current) throw new Error(`Handoff ${id} was not found.`)
  const now = new Date().toISOString()
  const updated: DepartmentHandoff = {
    ...current,
    status: input.status,
    notes: input.notes !== undefined ? input.notes.trim() || undefined : current.notes,
    acknowledgedAt:
      input.status === "ACKNOWLEDGED" || input.status === "IN_PROGRESS"
        ? current.acknowledgedAt ?? now
        : current.acknowledgedAt,
    completedAt: input.status === "COMPLETED" ? now : current.completedAt,
    updatedAt: now,
  }
  db.handoffs = db.handoffs.map((item) => (item.id === id ? updated : item))
  addAudit({
    incidentId: current.incidentId, actorId: actor.id, actorName: actor.name,
    action: "DEPARTMENT_HANDOFF_UPDATED", previousValue: current.status,
    newValue: input.status, reason: input.notes?.trim(),
    metadata: JSON.stringify({ handoffId: id, departmentId: current.departmentId }),
  }, now)
  persist()
  return clone(updated)
}

export async function apiCompleteHandoff(
  id: string,
  notes: string | undefined,
  actor: Actor
): Promise<DepartmentHandoff> {
  return apiUpdateHandoff(id, { status: "COMPLETED", notes }, actor)
}

/* ─── Notes / media / history ─── */

export async function apiGetNotes(incidentId: string): Promise<IncidentNote[]> {
  await wait()
  return clone(
    db.notes
      .filter((note) => note.incidentId === incidentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )
}

export async function apiAddNote(
  incidentId: string,
  body: string,
  actor: Actor
): Promise<IncidentNote> {
  await wait()
  getRequiredIncident(incidentId)
  if (!body.trim()) throw new Error("Note body is required.")
  const now = new Date().toISOString()
  const note: IncidentNote = {
    id: nextId("note"), incidentId, authorId: actor.id, authorName: actor.name,
    body: body.trim(), createdAt: now,
  }
  db.notes.push(note)
  addAudit({
    incidentId, actorId: actor.id, actorName: actor.name, action: "NOTE_ADDED",
  }, now)
  persist()
  return clone(note)
}

export async function apiGetMedia(incidentId: string): Promise<IncidentMedia[]> {
  await wait()
  return clone(db.media.filter((item) => item.incidentId === incidentId))
}

export async function apiAddMedia(
  incidentId: string,
  input: Pick<IncidentMedia, "kind" | "url" | "name">,
  actor: Actor
): Promise<IncidentMedia> {
  await wait()
  getRequiredIncident(incidentId)
  const now = new Date().toISOString()
  const media: IncidentMedia = {
    id: nextId("media"), incidentId, kind: input.kind,
    url: durableMediaUrl(input.kind, input.url),
    name: input.name.trim(), createdAt: now,
  }
  db.media.push(media)
  addAudit({
    incidentId, actorId: actor.id, actorName: actor.name,
    action: "MEDIA_ADDED", newValue: media.name,
  }, now)
  persist()
  return clone(media)
}

export async function apiRemoveMedia(id: string, actor: Actor): Promise<boolean> {
  await wait()
  const media = db.media.find((item) => item.id === id)
  if (!media) return false
  db.media = db.media.filter((item) => item.id !== id)
  addAudit({
    incidentId: media.incidentId, actorId: actor.id, actorName: actor.name,
    action: "MEDIA_REMOVED", previousValue: media.name,
  }, new Date().toISOString())
  persist()
  return true
}

export async function apiGetHistory(incidentId: string): Promise<StatusHistory[]> {
  await wait()
  return clone(
    db.statusHistory
      .filter((item) => item.incidentId === incidentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  )
}

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  await wait()
  const list = db.incidents.filter((item) => !item.archived)
  const today = new Date().toISOString().slice(0, 10)
  const awaitingHandoffAck = db.handoffs.filter(
    (h) => h.status === "PENDING" && list.some((i) => i.id === h.incidentId)
  ).length
  return {
    total: list.length,
    pending: list.filter((item) => item.status === "PENDING").length,
    verified: list.filter((item) => item.status === "VERIFIED").length,
    inProgress: list.filter((item) => item.status === "IN_PROGRESS").length,
    resolved: list.filter((item) => item.status === "RESOLVED").length,
    closed: list.filter((item) => item.status === "CLOSED").length,
    criticalUrgency: list.filter((item) => item.urgency === "CRITICAL").length,
    criticalSeverity: list.filter((item) => item.severity === "CRITICAL").length,
    awaitingVerification: list.filter((item) => item.status === "PENDING").length,
    awaitingResponse: list.filter((item) => item.status === "VERIFIED").length,
    awaitingHandoffAck,
    today: list.filter((item) => item.createdAt.startsWith(today)).length,
  }
}

export async function apiGetAuditLogs(options?: {
  incidentId?: string
}): Promise<AuditLog[]> {
  await wait()
  const list = options?.incidentId
    ? db.auditLogs.filter((item) => item.incidentId === options.incidentId)
    : db.auditLogs
  return clone([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function apiGetNotifications(): Promise<AppNotification[]> {
  await wait()
  return clone([...db.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function apiMarkNotificationRead(id: string): Promise<AppNotification> {
  await wait()
  const current = db.notifications.find((item) => item.id === id)
  if (!current) throw new Error(`Notification ${id} was not found.`)
  const updated = { ...current, read: true }
  db.notifications = db.notifications.map((item) => (item.id === id ? updated : item))
  persist()
  return clone(updated)
}

export async function apiMarkAllNotificationsRead(): Promise<number> {
  await wait()
  let count = 0
  db.notifications = db.notifications.map((item) => {
    if (item.read) return item
    count += 1
    return { ...item, read: true }
  })
  persist()
  return count
}

export async function apiGetVerificationStatuses(): Promise<Record<string, VerificationStatus>> {
  await wait()
  const map: Record<string, VerificationStatus> = {}
  for (const incident of db.incidents) {
    map[incident.id] = latestVerificationStatus(incident.id)
  }
  return clone(map)
}

/** Mock SMS/EMAIL channel enqueue - Sprint 1 records only. */
export async function apiCreateNotification(input: {
  incidentId?: string
  type: string
  channel: AppNotification["channel"]
  title: string
  body: string
}): Promise<AppNotification> {
  await wait()
  const now = new Date().toISOString()
  const notification: AppNotification = {
    id: nextId("notification"),
    incidentId: input.incidentId,
    type: input.type,
    channel: input.channel,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: now,
  }
  db.notifications.push(notification)
  persist()
  return clone(notification)
}
