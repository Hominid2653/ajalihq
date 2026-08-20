import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"

import type { AppDispatch, RootState } from "@/store/index"
import { selectAuthRole, selectAuthUser, selectIsAuthenticated } from "@/store/authSlice"
import { isAdmin, isUser } from "@/lib/rbac"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/** Convenience hook for auth + RBAC in components. */
export function useAuth() {
  const user = useAppSelector(selectAuthUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const role = useAppSelector(selectAuthRole)

  return {
    user,
    role,
    isAuthenticated,
    isAdmin: isAdmin(user),
    isUser: isUser(user),
  }
}
