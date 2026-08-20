import { apiCreateUser, apiGetUsers, type UserRecord } from "@/data/api"

export type SessionUser = {
  id: string
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

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await apiGetUsers(email)
  const normalized = email.trim().toLowerCase()
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

export async function createUser(input: {
  name: string
  email: string
  phone: string
  role?: string
}): Promise<UserRecord> {
  return apiCreateUser(input)
}
