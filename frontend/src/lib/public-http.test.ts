import { afterEach, describe, expect, it, vi } from "vitest"

import {
  PublicHttpError,
  assertAllowedUrl,
  fetchPublicJson,
  resolveAllowedBaseUrl,
} from "@/lib/public-http"

const GEOCODE = "https://geocoding-api.open-meteo.com"
const WEATHER = "https://api.open-meteo.com"

describe("resolveAllowedBaseUrl", () => {
  it("keeps an allow-listed HTTPS host from env", () => {
    expect(resolveAllowedBaseUrl(GEOCODE, WEATHER).origin).toBe(GEOCODE)
  })

  it("falls back when the env host is not allowed", () => {
    expect(
      resolveAllowedBaseUrl("https://evil.example", GEOCODE).origin
    ).toBe(GEOCODE)
  })

  it("falls back when the env value is http", () => {
    expect(
      resolveAllowedBaseUrl("http://geocoding-api.open-meteo.com", GEOCODE)
        .origin
    ).toBe(GEOCODE)
  })

  it("falls back when the env value is not a URL", () => {
    expect(resolveAllowedBaseUrl("not-a-url", GEOCODE).origin).toBe(GEOCODE)
  })
})

describe("assertAllowedUrl", () => {
  it("allows Open-Meteo HTTPS URLs", () => {
    expect(() => assertAllowedUrl(new URL(`${WEATHER}/v1/forecast`))).not.toThrow()
  })

  it("blocks other hosts", () => {
    expect(() => assertAllowedUrl(new URL("https://example.com/v1"))).toThrow(
      PublicHttpError
    )
  })
})

describe("fetchPublicJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("requests JSON without credentials and parses a valid body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchPublicJson(
      new URL(`${GEOCODE}/v1/search`),
      (data) => data as { ok: boolean }
    )

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      `${GEOCODE}/v1/search`,
      expect.objectContaining({
        method: "GET",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      })
    )
  })

  it("rejects a blocked host before calling fetch", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      fetchPublicJson(new URL("https://example.com/data"), () => null)
    ).rejects.toThrow(/allow-list/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects a non-JSON content type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => "text/html" },
        json: async () => ({}),
      })
    )

    await expect(
      fetchPublicJson(new URL(`${GEOCODE}/v1/search`), () => null)
    ).rejects.toThrow(/not JSON/)
  })
})
