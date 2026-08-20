/** Canonical Ajali! roles - use these everywhere in the frontend. */
export type Role = "USER" | "ADMIN"

export type PreferredContactMethod = "PHONE" | "EMAIL" | "OTHER"

/** Authenticated user stored in Redux auth state. */
export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  avatarUrl?: string
  location?: string
  bio?: string
  preferredContactMethod?: PreferredContactMethod
  profileComplete?: boolean
}

/** Persisted session shape (localStorage). Matches AuthUser for easy Sprint 2 swap. */
export type AuthSession = AuthUser

/** Legacy / API role strings mapped to canonical Role. */
const ADMIN_ALIASES = new Set(["admin", "ADMIN"])
const USER_ALIASES = new Set(["user", "USER", "reporter", "citizen"])

export function normalizeRole(raw: string | undefined | null): Role {
  if (!raw) return "USER"
  const lower = raw.toLowerCase()
  if (ADMIN_ALIASES.has(raw) || lower === "admin") return "ADMIN"
  if (USER_ALIASES.has(raw) || lower === "user" || lower === "reporter") return "USER"
  return "USER"
}

export function toAuthUser(input: {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  avatarUrl?: string
  location?: string
  bio?: string
  preferredContactMethod?: PreferredContactMethod
  profileComplete?: boolean
}): AuthUser {
  const phone = input.phone
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: normalizeRole(input.role),
    phone,
    avatarUrl: input.avatarUrl,
    location: input.location,
    bio: input.bio,
    preferredContactMethod: input.preferredContactMethod ?? "PHONE",
    profileComplete:
      input.profileComplete ?? Boolean(input.name.trim() && phone),
  }
}

export function isProfileComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return Boolean(user.profileComplete ?? (user.name.trim() && user.phone))
}
