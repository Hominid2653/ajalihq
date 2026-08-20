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

export type IncidentRecord = {
  id: string
  title: string
  description: string
  status: string
  location: string
  /** WGS84 latitude — used by mapcn / MapLibre */
  lat: number
  /** WGS84 longitude — used by mapcn / MapLibre */
  lng: number
  userId: string
  createdAt: string
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
/** Bump when seed shape changes so browsers refresh lat/lng coords. */
const STORAGE_VERSION = 2

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
      title: "Traffic collision on Mombasa Road",
      description:
        "Two vehicles collided near the Nyayo Stadium exit. Traffic is delayed in both directions.",
      status: "reported",
      location: "Mombasa Road, Nairobi",
      lat: -1.3102,
      lng: 36.8348,
      userId: "1",
      createdAt: "2026-08-18T09:15:00.000Z",
    },
    {
      id: "2",
      title: "Flooding in South B",
      description:
        "Heavy rain left several streets impassable. Residents are requesting assistance.",
      status: "investigating",
      location: "South B, Nairobi",
      lat: -1.3165,
      lng: 36.8412,
      userId: "1",
      createdAt: "2026-08-18T11:42:00.000Z",
    },
    {
      id: "3",
      title: "Fire outbreak near Gikomba",
      description:
        "Smoke reported from a market stall cluster. Fire brigade en route.",
      status: "verified",
      location: "Gikomba, Nairobi",
      lat: -1.2839,
      lng: 36.8405,
      userId: "1",
      createdAt: "2026-08-19T07:05:00.000Z",
    },
    {
      id: "4",
      title: "Road blockage on Waiyaki Way",
      description:
        "Overturned lorry blocking outbound lanes near Westlands.",
      status: "investigating",
      location: "Westlands, Nairobi",
      lat: -1.2674,
      lng: 36.8108,
      userId: "1",
      createdAt: "2026-08-19T14:20:00.000Z",
    },
    {
      id: "5",
      title: "Medical emergency at Uhuru Park",
      description:
        "Bystanders report a person collapsed near the main gate.",
      status: "reported",
      location: "Uhuru Park, Nairobi",
      lat: -1.2893,
      lng: 36.8172,
      userId: "1",
      createdAt: "2026-08-20T06:40:00.000Z",
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
  location: string
  userId: string
  status?: string
  lat?: number
  lng?: number
}): Promise<IncidentRecord> {
  await wait()
  const incident: IncidentRecord = {
    id: nextId(),
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    lat: input.lat ?? -1.2864,
    lng: input.lng ?? 36.8172,
    userId: input.userId,
    status: input.status ?? "reported",
    createdAt: new Date().toISOString(),
  }
  db = { ...db, incidents: [...db.incidents, incident] }
  persist()
  return incident
}

export async function apiGetComments(incidentId?: string): Promise<CommentRecord[]> {
  await wait()
  if (!incidentId) return [...db.comments]
  return db.comments.filter((comment) => comment.incidentId === incidentId)
}
