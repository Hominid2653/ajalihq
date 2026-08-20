import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { readSession, removeSession, writeSession } from "@/lib/auth-storage"
import type { AuthUser } from "@/types/auth"

export type AuthState = {
  user: AuthUser | null
  /** True once we've read persisted session from storage. */
  hydrated: boolean
}

const initialState: AuthState = {
  user: readSession(),
  hydrated: typeof localStorage !== "undefined",
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state) {
      state.user = readSession()
      state.hydrated = true
    },
    login(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      writeSession(action.payload)
    },
    logout(state) {
      state.user = null
      removeSession()
    },
  },
})

export const { hydrate, login, logout } = authSlice.actions
export const authReducer = authSlice.reducer

/** Selectors */
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.user !== null
export const selectAuthRole = (state: { auth: AuthState }) =>
  state.auth.user?.role ?? null
export const selectAuthHydrated = (state: { auth: AuthState }) =>
  state.auth.hydrated
