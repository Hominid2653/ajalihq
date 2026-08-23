/**
 * Browser HTTP helper for public complement APIs only.
 *
 * Security rules (do not weaken these):
 * - HTTPS only
 * - Hostname allow-list (no arbitrary env URLs)
 * - Timeouts + AbortController
 * - No credentials, cookies, or Authorization headers
 * - Never attach incident, reporter, or auth payloads
 * - Validate JSON with a caller-supplied parser before use
 */

const DEFAULT_TIMEOUT_MS = 8_000

const ALLOWED_HOSTS = new Set([
  "geocoding-api.open-meteo.com",
  "api.open-meteo.com",
])

export class PublicHttpError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "PublicHttpError"
    this.status = status
  }
}

export function resolveAllowedBaseUrl(
  envValue: string | undefined,
  fallback: string
): URL {
  const raw = (envValue ?? fallback).trim() || fallback
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    parsed = new URL(fallback)
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return new URL(fallback)
  }

  return parsed
}

export function assertAllowedUrl(url: URL): void {
  if (url.protocol !== "https:") {
    throw new PublicHttpError("Blocked: only HTTPS public APIs are allowed.")
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new PublicHttpError("Blocked: host is not on the public API allow-list.")
  }
}

export async function fetchPublicJson<T>(
  url: URL,
  parse: (data: unknown) => T,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<T> {
  assertAllowedUrl(url)

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  const onAbort = () => controller.abort()
  options?.signal?.addEventListener("abort", onAbort)

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new PublicHttpError("Public data is unavailable right now.", response.status)
    }

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new PublicHttpError("Public data response was not JSON.")
    }

    const data: unknown = await response.json()
    return parse(data)
  } catch (error) {
    if (error instanceof PublicHttpError) throw error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new PublicHttpError("The public data request timed out.")
    }
    throw new PublicHttpError("Could not load public data.")
  } finally {
    window.clearTimeout(timeout)
    options?.signal?.removeEventListener("abort", onAbort)
  }
}
