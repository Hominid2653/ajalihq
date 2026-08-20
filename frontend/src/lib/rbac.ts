import type { Role, AuthUser } from "@/types/auth"

/** Central RBAC helpers — import these instead of inline role checks. */

export const ROLES = {
  USER: "USER" as const,
  ADMIN: "ADMIN" as const,
} satisfies Record<string, Role>

export function hasRole(user: AuthUser | null | undefined, role: Role): boolean {
  return user?.role === role
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return hasRole(user, ROLES.ADMIN)
}

export function isUser(user: AuthUser | null | undefined): boolean {
  return hasRole(user, ROLES.USER)
}

/** Roles allowed to access a route or feature. */
export function hasAnyRole(
  user: AuthUser | null | undefined,
  allowed: readonly Role[]
): boolean {
  if (!user) return false
  return allowed.includes(user.role)
}

/** Default post-login destination by role. */
export function defaultHomeForRole(role: Role): string {
  return role === ROLES.ADMIN ? "/admin" : "/dashboard"
}

/** Admin-only route prefix — used by guards and nav visibility. */
export const ADMIN_ROUTE_PREFIX = "/admin"

export function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`)
}
