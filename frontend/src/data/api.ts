/**
 * In-browser mock API for Ajali!.
 * Seed lives in this module so Vercel static deploys do not need json-server.
 * Writes stay in memory and are mirrored to localStorage for this browser.
 */

export type UserRecord = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
}

export type IncidentType =
  | "traffic"
  | "fire"
  | "flooding"
  | "medical"
  | "security"
  | "infrastructure"
  | "other"

export type IncidentSeverity = "low" | "medium" | "high" | "critical"

export type IncidentRecord = {
  id: string
  referenceNumber: string
  title: string
  description: string
  incidentType: IncidentType
  severity: IncidentSeverity
  status: string
  location: string
  userId: string
  createdAt: string
  updatedAt?: string
}

export type CommentRecord = {
  id: string
  incidentId: string
  userId: string
  body: string
  createdAt: string
}

type Database = {
  users: UserRecord[]
  incidents: IncidentRecord[]
  comments: CommentRecord[]
}

const STORAGE_KEY = "ajali-data"
const STORAGE_VERSION = 2

function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `AJH-${year}-${random}`
}

const seed: Database = {
  users: [
    {
      id: "1",
      name: "Amina Otieno",
      email: "amina@ajalihq.test",
      role: "reporter",
    },
    {
      id: "2",
      name: "Brian Mwangi",
      email: "brian@ajalihq.test",
      role: "admin",
    },
  ],
  incidents: [
    {
      id: "1",
      referenceNumber: "AJH-2026-1001",
      title: "Traffic collision on Mombasa Road",
      description:
        "Two vehicles collided near the Nyayo Stadium exit. Traffic is delayed in both directions.",
      incidentType: "traffic",
      severity: "medium",
      status: "reported",
      location: "Nairobi",
      userId: "1",
      createdAt: "2026-08-18T09:15:00.000Z",
    },
    {
      id: "2",
      referenceNumber: "AJH-2026-1002",
      title: "Flooding in South B",
      description:
        "Heavy rain left several streets impassable. Residents are requesting assistance.",
      incidentType: "flooding",
      severity: "high",
      status: "investigating",
      location: "Nairobi",
      userId: "1",
      createdAt: "2026-08-18T11:42:00.000Z",
    },
  ],
  comments: [
    {
      id: "1",
      incidentId: "1",
      userId: "2",
      body: "Emergency responders have been notified.",
      createdAt: "2026-08-18T09:30:00.000Z",
    },
  ],
}

type Stored = Database & { version: number }

function cloneSeed(): Database {
  return structuredClone(seed)
}

function mergeWithSeed(stored: Database): Database {
  const merge = <T extends { id: string }>(seedList: T[], extra: T[] | undefined) => {
    const map = new Map<string, T>()
    for (const item of extra ?? []) map.set(item.id, item)
    for (const item of seedList) map.set(item.id, item)
    return [...map.values()]
  }

  return {
    users: merge(seed.users, stored.users),
    incidents: merge(seed.incidents, stored.incidents),
    comments: merge(seed.comments, stored.comments),
  }
}

function readStored(): Database {
  if (typeof localStorage === "undefined") return cloneSeed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeed()
    const parsed = JSON.parse(raw) as Stored
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.users)) {
      return cloneSeed()
    }
    return mergeWithSeed(parsed)
  } catch {
    return cloneSeed()
  }
}

let db = readStored()

function persist() {
  if (typeof localStorage === "undefined") return
  const payload: Stored = { version: STORAGE_VERSION, ...db }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function wait(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextId() {
  return String(Date.now())
}

export async function apiGetUsers(email?: string): Promise<UserRecord[]> {
  await wait()
  const list = db.users
  if (!email) return [...list]
  const normalized = email.trim().toLowerCase()
  return list.filter((user) => user.email.toLowerCase() === normalized)
}

export async function apiCreateUser(input: {
  name: string
  email: string
  phone?: string
  role?: string
}): Promise<UserRecord> {
  await wait()
  const existing = db.users.find(
    (user) => user.email.toLowerCase() === input.email.trim().toLowerCase()
  )
  if (existing) return existing

  const user: UserRecord = {
    id: nextId(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim(),
    role: input.role ?? "reporter",
  }
  db = { ...db, users: [...db.users, user] }
  persist()
  return user
}

export async function apiGetIncidents(): Promise<IncidentRecord[]> {
  await wait()
  return [...db.incidents].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )
}

export async function apiGetIncident(
  id: string
): Promise<IncidentRecord | null> {
  await wait()
  return db.incidents.find((incident) => incident.id === id) ?? null
}

export async function apiCreateIncident(input: {
  title: string
  description: string
  incidentType: IncidentType
  severity: IncidentSeverity
  location: string
  userId: string
  status?: string
}): Promise<IncidentRecord> {
  await wait()
  const incident: IncidentRecord = {
    id: nextId(),
    referenceNumber: generateReferenceNumber(),
    title: input.title.trim(),
    description: input.description.trim(),
    incidentType: input.incidentType,
    severity: input.severity,
    location: input.location.trim(),
    userId: input.userId,
    status: input.status ?? "reported",
    createdAt: new Date().toISOString(),
  }
  db = { ...db, incidents: [...db.incidents, incident] }
  persist()
  return incident
}

export async function apiUpdateIncident(
  id: string,
  input: Partial<{
    title: string
    description: string
    incidentType: IncidentType
    severity: IncidentSeverity
    location: string
    status: string
  }>
): Promise<IncidentRecord> {
  await wait()
  const index = db.incidents.findIndex((incident) => incident.id === id)
  if (index === -1) {
    throw new Error(`Incident ${id} not found`)
  }
  const updated: IncidentRecord = {
    ...db.incidents[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }
  db = {
    ...db,
    incidents: [
      ...db.incidents.slice(0, index),
      updated,
      ...db.incidents.slice(index + 1),
    ],
  }
  persist()
  return updated
}

// Soft action: flips status to "withdrawn" rather than removing the record.
export async function apiWithdrawIncident(id: string): Promise<IncidentRecord> {
  return apiUpdateIncident(id, { status: "withdrawn" })
}

// Hard action: removes the record entirely.
export async function apiDeleteIncident(id: string): Promise<void> {
  await wait()
  const exists = db.incidents.some((incident) => incident.id === id)
  if (!exists) {
    throw new Error(`Incident ${id} not found`)
  }
  db = { ...db, incidents: db.incidents.filter((incident) => incident.id !== id) }
  persist()
}

export async function apiGetComments(incidentId?: string): Promise<CommentRecord[]> {
  await wait()
  if (!incidentId) return [...db.comments]
  return db.comments.filter((comment) => comment.incidentId === incidentId)
}