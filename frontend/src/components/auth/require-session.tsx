import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { getSession } from "@/lib/auth"

function RequireSession({ children }: { children: ReactNode }) {
  const location = useLocation()
  const session = getSession()

  if (!session) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  return children
}

export { RequireSession }
