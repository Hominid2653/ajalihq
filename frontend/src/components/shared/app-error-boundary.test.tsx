import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AppErrorBoundary } from "@/components/shared/app-error-boundary"

function Boom() {
  throw new Error("test crash")
}

describe("AppErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <AppErrorBoundary>
        <p>Safe content</p>
      </AppErrorBoundary>
    )
    expect(screen.getByText("Safe content")).toBeInTheDocument()
  })

  it("shows a fallback when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument()
    spy.mockRestore()
  })
})
