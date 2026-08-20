import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/store/hooks"
import { defaultHomeForRole } from "@/lib/rbac"
import type { Role } from "@/types/auth"

type ProtectedRouteProps = {
  children: ReactNode
  /** If set, only these roles may access. Unauthenticated → /signin. Wrong role → home. */
  roles?: readonly Role[]
  /** Override redirect for wrong role (default: role-based home). */
  forbiddenTo?: string
}

/**
 * Guards routes that require authentication (and optionally specific roles).
 * Use `roles={["ADMIN"]}` for admin-only pages.
 */
function ProtectedRoute({
  children,
  roles,
  forbiddenTo,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { user, isAuthenticated, role } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    )
  }

  if (roles && role && !roles.includes(role)) {
    const target = forbiddenTo ?? defaultHomeForRole(role)
    return <Navigate to={target} replace />
  }

  return children
}

export { ProtectedRoute }
