import { describe, expect, it } from "vitest"

import { filterLocationSuggestions } from "@/lib/locations"

describe("filterLocationSuggestions", () => {
  it("returns seed places when the query is empty", () => {
    expect(filterLocationSuggestions("").length).toBeGreaterThan(0)
  })

  it("matches a Kenyan place by label", () => {
    const results = filterLocationSuggestions("westlands")
    expect(results.some((item) => item.label.includes("Westlands"))).toBe(true)
  })

  it("returns nothing for an unknown place", () => {
    expect(filterLocationSuggestions("zzzz-not-a-town")).toEqual([])
  })
})
