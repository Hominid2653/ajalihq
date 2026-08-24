import { describe, expect, it } from "vitest"

import { isValidIdNumber, normalizeRole } from "@/types/auth"

describe("normalizeRole", () => {
  it("maps admin aliases", () => {
    expect(normalizeRole("admin")).toBe("ADMIN")
    expect(normalizeRole("ADMIN")).toBe("ADMIN")
  })

  it("defaults unknown values to USER", () => {
    expect(normalizeRole("citizen")).toBe("USER")
    expect(normalizeRole(undefined)).toBe("USER")
  })
})

describe("isValidIdNumber", () => {
  it("accepts 7 or 8 digits", () => {
    expect(isValidIdNumber("28473615")).toBe(true)
    expect(isValidIdNumber("1234567")).toBe(true)
  })

  it("rejects short or empty values", () => {
    expect(isValidIdNumber("123")).toBe(false)
    expect(isValidIdNumber("")).toBe(false)
  })
})
