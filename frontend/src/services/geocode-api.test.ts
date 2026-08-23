import { describe, expect, it } from "vitest"

import { sanitizePlaceQuery } from "@/services/geocode-api"

describe("sanitizePlaceQuery", () => {
  it("trims and keeps a normal Kenyan place name", () => {
    expect(sanitizePlaceQuery("  Thika  ")).toBe("Thika")
  })

  it("rejects URLs so they never reach Open-Meteo", () => {
    expect(sanitizePlaceQuery("https://evil.example/thika")).toBe("")
  })

  it("rejects HTML", () => {
    expect(sanitizePlaceQuery("<script>alert(1)</script>")).toBe("")
  })

  it("rejects queries with no letters", () => {
    expect(sanitizePlaceQuery("12345")).toBe("")
  })

  it("caps length at 80 characters", () => {
    const long = `Nairobi${"a".repeat(100)}`
    expect(sanitizePlaceQuery(long).length).toBe(80)
  })
})
