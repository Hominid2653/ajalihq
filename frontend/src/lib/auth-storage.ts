import type { AuthSession } from "@/types/auth"
import { toAuthUser } from "@/types/auth"

const SESSION_KEY = "ajali-session"
const TOKEN_KEY = "ajali-token"
const PENDING_EMAIL_KEY = "ajali-pending-email"

export function readToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function writeToken(token: string): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
}

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

export function writeSession(user: AuthSession, token?: string): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function removeSession(): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function setPendingEmail(email: string): void {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(PENDING_EMAIL_KEY, email)
}

export function getPendingEmail(): string {
  if (typeof sessionStorage === "undefined") return ""
  return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? ""
}

export function clearPendingEmail(): void {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.removeItem(PENDING_EMAIL_KEY)
}
