import type { ReactNode } from "react"

import { useAuth } from "@/store/hooks"
import { hasAnyRole } from "@/lib/rbac"
import type { Role } from "@/types/auth"

type RoleGuardProps = {
  /** Roles that may see this content. */
  roles: readonly Role[]
  children: ReactNode
  /** Optional fallback when role doesn't match (default: render nothing). */
  fallback?: ReactNode
}

/** Conditionally render children based on the current user's role. */
function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  if (!hasAnyRole(user, roles)) return fallback
  return children
}

export { RoleGuard }
