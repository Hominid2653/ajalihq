export type SessionUser = {
  id: number
  name: string
  email: string
  role: string
}

const STORAGE_KEY = "ajali-session"
const PENDING_EMAIL_KEY = "ajali-pending-email"

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function setSession(user: SessionUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function setPendingEmail(email: string) {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email)
}

export function getPendingEmail() {
  return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? ""
}

export function clearPendingEmail() {
  sessionStorage.removeItem(PENDING_EMAIL_KEY)
}

type UserRecord = SessionUser & { phone?: string }

async function parseUsers(response: Response): Promise<UserRecord[]> {
  const payload = (await response.json()) as unknown
  if (Array.isArray(payload)) return payload as UserRecord[]
  if (payload && typeof payload === "object") {
    const record = payload as { data?: UserRecord[]; users?: UserRecord[] }
    if (Array.isArray(record.data)) return record.data
    if (Array.isArray(record.users)) return record.users
  }
  return []
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase()
  try {
    const response = await fetch(
      `/api/users?email=${encodeURIComponent(email.trim())}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (response.ok) {
      const users = await parseUsers(response)
      const match = users.find((user) => user.email.toLowerCase() === normalized)
      if (match) return match
    }
  } catch {
    // json-server may not be running; fall through to demo users
  }

  return (
    DEMO_USERS.find((user) => user.email.toLowerCase() === normalized) ?? null
  )
}

export async function createUser(input: {
  name: string
  email: string
  phone: string
  role?: string
}): Promise<UserRecord> {
  const body = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    role: input.role ?? "reporter",
  }

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    })
    if (response.ok) {
      return (await response.json()) as UserRecord
    }
  } catch {
    // ignore and use local fallback
  }

  return { id: Date.now(), ...body }
}

const DEMO_USERS: UserRecord[] = [
  {
    id: 1,
    name: "Amina Otieno",
    email: "amina@ajalihq.test",
    role: "reporter",
  },
  {
    id: 2,
    name: "Brian Mwangi",
    email: "brian@ajalihq.test",
    role: "admin",
  },
]
