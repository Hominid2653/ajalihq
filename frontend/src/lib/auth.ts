/**
 * Auth service - thin facade over api.ts.
 * Sprint 2: swap internals to call Flask; keep this interface stable for Redux + pages.
 */
import {
  apiAuthenticate,
  apiCreateUser,
  apiGetUser,
  apiGetUsers,
  apiUpdateUser,
  type UpdateUserPatch,
  type UserRecord,
} from "@/data/api"
import {
  clearPendingEmail,
  getPendingEmail,
  readSession,
  removeSession,
  setPendingEmail,
  writeSession,
} from "@/lib/auth-storage"
import { login, logout, updateProfile as updateProfileAction } from "@/store/authSlice"
import { toAuthUser, type AuthUser } from "@/types/auth"
import type { AppDispatch } from "@/store/index"

export { getPendingEmail, setPendingEmail, clearPendingEmail }

export type { AuthUser }

export function mapUserRecord(user: UserRecord): AuthUser {
  return toAuthUser(user)
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await apiGetUsers(email)
  const normalized = email.trim().toLowerCase()
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null
}

/** Mock authenticate - password ignored in Sprint 1. */
export async function authenticate(
  email: string,
  _password?: string
): Promise<AuthUser | null> {
  const user = await apiAuthenticate(email)
  return user ? mapUserRecord(user) : null
}

export async function registerUser(input: {
  name: string
  email: string
  phone: string
  avatarUrl?: string
}): Promise<AuthUser> {
  const user = await apiCreateUser({ ...input, role: "USER" })
  return mapUserRecord(user)
}

export async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const user = await apiGetUser(userId)
  return user ? mapUserRecord(user) : null
}

export async function updateUserProfile(
  userId: string,
  patch: UpdateUserPatch
): Promise<AuthUser> {
  const user = await apiUpdateUser(userId, patch)
  return mapUserRecord(user)
}

export function signIn(dispatch: AppDispatch, user: AuthUser) {
  dispatch(login(user))
}

export function signOut(dispatch: AppDispatch) {
  dispatch(logout())
}

/** Persist profile changes to Redux + localStorage after API success. */
export function applyProfile(dispatch: AppDispatch, user: AuthUser) {
  dispatch(updateProfileAction(user))
}

/** Read session directly from storage (non-reactive). Prefer useAuth(). */
export function getSession(): AuthUser | null {
  return readSession()
}

/** @deprecated Prefer signIn(dispatch, user) */
export function setSession(user: AuthUser) {
  writeSession(user)
}

/** @deprecated Prefer signOut(dispatch) */
export function clearSession() {
  removeSession()
}

/** @deprecated Use registerUser */
export const createUser = registerUser
