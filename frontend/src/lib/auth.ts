/**
 * Auth service facade.
 * Supports live Flask REST API (/api/v1) with Bearer token storage,
 * and fallback to in-memory mock when VITE_USE_MOCK_API=true.
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
  removeToken,
  setPendingEmail,
  writeSession,
  writeToken,
} from "@/lib/auth-storage"
import { env } from "@/lib/env"
import { apiClient, ApiError } from "@/lib/http-client"
import { login, logout, updateProfile as updateProfileAction } from "@/store/authSlice"
import { toAuthUser, type AuthUser, type PreferredContactMethod } from "@/types/auth"
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

export async function authenticate(
  email: string,
  password?: string
): Promise<AuthUser | null> {
  if (!env.useMockApi) {
    try {
      const res = await apiClient.post<{ accessToken: string; user: AuthUser }>(
        "/api/v1/auth/login",
        {
          email: email.trim().toLowerCase(),
          password: password || "password",
        },
        { skipAuth: true }
      )
      if (res?.accessToken) {
        writeToken(res.accessToken)
      }
      const user = toAuthUser(res.user)
      writeSession(user, res?.accessToken)
      return user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null
      }
      throw err
    }
  }

  const user = await apiAuthenticate(email)
  return user ? mapUserRecord(user) : null
}

export async function registerUser(input: {
  name: string
  email: string
  password?: string
  phone?: string
  avatarUrl?: string
  location?: string
  idNumber?: string
  preferredContactMethod?: PreferredContactMethod
}): Promise<AuthUser> {
  if (!env.useMockApi) {
    const regPayload = {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password || "password123",
      phone: input.phone?.trim() || null,
      avatarUrl: input.avatarUrl || null,
      location: input.location?.trim() || null,
      idNumber: input.idNumber?.trim() || null,
      preferredContactMethod: input.preferredContactMethod || "PHONE",
    }

    const userRecord = await apiClient.post<AuthUser>(
      "/api/v1/auth/register",
      regPayload,
      { skipAuth: true }
    )

    // Automatically exchange credentials for accessToken after registration
    try {
      const loginRes = await apiClient.post<{ accessToken: string; user: AuthUser }>(
        "/api/v1/auth/login",
        {
          email: input.email.trim().toLowerCase(),
          password: input.password || "password123",
        },
        { skipAuth: true }
      )
      if (loginRes?.accessToken) {
        writeToken(loginRes.accessToken)
        const loggedUser = toAuthUser(loginRes.user)
        writeSession(loggedUser, loginRes.accessToken)
        return loggedUser
      }
    } catch {
      // Fall through to returning registered record
    }

    const user = toAuthUser(userRecord)
    writeSession(user)
    return user
  }

  const user = await apiCreateUser({ ...input, role: "USER" })
  return mapUserRecord(user)
}

export async function fetchProfile(userId?: string): Promise<AuthUser | null> {
  if (!env.useMockApi) {
    try {
      const res = await apiClient.get<AuthUser>("/api/v1/auth/me")
      const user = toAuthUser(res)
      writeSession(user)
      return user
    } catch {
      return null
    }
  }

  if (!userId) return null
  const user = await apiGetUser(userId)
  return user ? mapUserRecord(user) : null
}

export async function updateUserProfile(
  userId: string,
  patch: UpdateUserPatch
): Promise<AuthUser> {
  if (!env.useMockApi) {
    const res = await apiClient.patch<AuthUser>("/api/v1/auth/me", patch)
    const user = toAuthUser(res)
    writeSession(user)
    return user
  }

  const user = await apiUpdateUser(userId, patch)
  return mapUserRecord(user)
}

export function signIn(dispatch: AppDispatch, user: AuthUser, token?: string) {
  writeSession(user, token)
  dispatch(login(user))
}

export function signOut(dispatch: AppDispatch) {
  removeSession()
  removeToken()
  dispatch(logout())
}

/** Persist profile changes to Redux + localStorage after API success. */
export function applyProfile(dispatch: AppDispatch, user: AuthUser) {
  writeSession(user)
  dispatch(updateProfileAction(user))
}

/** Read session directly from storage (non-reactive). Prefer useAuth(). */
export function getSession(): AuthUser | null {
  return readSession()
}

/** @deprecated Prefer signIn(dispatch, user) */
export function setSession(user: AuthUser, token?: string) {
  writeSession(user, token)
}

/** @deprecated Prefer signOut(dispatch) */
export function clearSession() {
  removeSession()
  removeToken()
}

/** @deprecated Use registerUser */
export const createUser = registerUser
