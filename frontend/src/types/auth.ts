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
  /** National ID / passport number used for account verification. */
  idNumber?: string
  /** True when the account has a verified ID number on file. */
  verified?: boolean
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

/** Normalize and validate a Kenyan-style national ID (7–8 digits). */
export function normalizeIdNumber(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  const digits = raw.replace(/\D/g, "")
  return digits || undefined
}

export function isValidIdNumber(raw: string | undefined | null): boolean {
  const digits = normalizeIdNumber(raw)
  return Boolean(digits && digits.length >= 7 && digits.length <= 8)
}

export function isAccountVerified(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return Boolean(user.verified ?? (user.idNumber && isValidIdNumber(user.idNumber)))
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
  idNumber?: string
  verified?: boolean
}): AuthUser {
  const phone = input.phone
  const idNumber = normalizeIdNumber(input.idNumber)
  const verified = input.verified ?? Boolean(idNumber && isValidIdNumber(idNumber))
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
    idNumber,
    verified,
  }
}

export function isProfileComplete(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return Boolean(user.profileComplete ?? (user.name.trim() && user.phone))
}
