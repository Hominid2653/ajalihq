import { describe, expect, it } from "vitest"

import {
  defaultHomeForRole,
  hasAnyRole,
  isAdmin,
  isAdminRoute,
  ROLES,
} from "@/lib/rbac"
import type { AuthUser } from "@/types/auth"

const admin: AuthUser = {
  id: "2",
  name: "Brian Mwangi",
  email: "brian@ajalihq.test",
  role: "ADMIN",
  verified: true,
}

const citizen: AuthUser = {
  id: "1",
  name: "Amina Otieno",
  email: "amina@ajalihq.test",
  role: "USER",
  verified: true,
}

describe("rbac", () => {
  it("sends admins to the operations panel", () => {
    expect(defaultHomeForRole(ROLES.ADMIN)).toBe("/admin")
    expect(defaultHomeForRole(ROLES.USER)).toBe("/dashboard")
  })

  it("treats only ADMIN as admin", () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(citizen)).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })

  it("checks allowed roles for a route", () => {
    expect(hasAnyRole(citizen, [ROLES.USER, ROLES.ADMIN])).toBe(true)
    expect(hasAnyRole(citizen, [ROLES.ADMIN])).toBe(false)
    expect(hasAnyRole(null, [ROLES.USER])).toBe(false)
  })

  it("detects admin paths", () => {
    expect(isAdminRoute("/admin")).toBe(true)
    expect(isAdminRoute("/admin/incidents")).toBe(true)
    expect(isAdminRoute("/dashboard")).toBe(false)
  })
})
