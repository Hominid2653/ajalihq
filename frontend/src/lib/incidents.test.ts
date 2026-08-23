import { describe, expect, it } from "vitest"

import { isCitizenEditable } from "@/lib/incidents"
import { canTransition } from "@/types/incident"
import type { Incident } from "@/types/incident"

function report(status: Incident["status"], archived = false) {
  return { status, archived } as Incident
}

describe("incident lifecycle", () => {
  it("allows the normal verify path", () => {
    expect(canTransition("PENDING", "VERIFIED")).toBe(true)
    expect(canTransition("VERIFIED", "IN_PROGRESS")).toBe(true)
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true)
  })

  it("allows closing a pending report as false", () => {
    expect(canTransition("PENDING", "CLOSED")).toBe(true)
  })

  it("blocks skipping verification", () => {
    expect(canTransition("PENDING", "IN_PROGRESS")).toBe(false)
    expect(canTransition("PENDING", "RESOLVED")).toBe(false)
  })
})

describe("isCitizenEditable", () => {
  it("allows edit only while pending and not archived", () => {
    expect(isCitizenEditable(report("PENDING"))).toBe(true)
    expect(isCitizenEditable(report("VERIFIED"))).toBe(false)
    expect(isCitizenEditable(report("PENDING", true))).toBe(false)
  })
})
