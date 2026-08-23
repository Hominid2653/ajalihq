import { describe, expect, it } from "vitest"

import { sanitizeCoordinate } from "@/services/weather-api"

describe("sanitizeCoordinate", () => {
  it("rounds a valid latitude", () => {
    expect(sanitizeCoordinate(-1.286389, -90, 90)).toBe(-1.2864)
  })

  it("rejects out-of-range values", () => {
    expect(sanitizeCoordinate(100, -90, 90)).toBeNull()
    expect(sanitizeCoordinate(-200, -180, 180)).toBeNull()
  })

  it("rejects non-finite values", () => {
    expect(sanitizeCoordinate(Number.NaN, -90, 90)).toBeNull()
    expect(sanitizeCoordinate(Number.POSITIVE_INFINITY, -90, 90)).toBeNull()
  })
})
