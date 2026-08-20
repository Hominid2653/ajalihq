import type { AuthSession } from "@/types/auth"
import { toAuthUser } from "@/types/auth"

const SESSION_KEY = "ajali-session"
const PENDING_EMAIL_KEY = "ajali-pending-email"

export function readSession(): AuthSession | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    return toAuthUser(parsed)
  } catch {
    return null
  }
}

export function writeSession(user: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function removeSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function setPendingEmail(email: string): void {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email)
}

export function getPendingEmail(): string {
  return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? ""
}

export function clearPendingEmail(): void {
  sessionStorage.removeItem(PENDING_EMAIL_KEY)
}
