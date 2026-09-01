import { useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { readSession, readToken, removeSession, removeToken } from "@/lib/auth-storage"
import { env } from "@/lib/env"
import { logout } from "@/store/authSlice"
import { useAppDispatch } from "@/store/hooks"

/**
 * If Redux/local session exists but JWT is missing (common after stale deploys),
 * force a clean re-login so protected media endpoints receive Authorization headers.
 */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (env.useMockApi) return

    const session = readSession()
    const token = readToken()
    if (session && !token) {
      removeSession()
      removeToken()
      dispatch(logout())
      navigate("/signin", { replace: true, state: { reason: "session-expired" } })
    }
  }, [dispatch, navigate])

  return children
}

export { AuthBootstrap }
