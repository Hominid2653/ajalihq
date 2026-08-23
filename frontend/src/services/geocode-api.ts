/**
 * Open-Meteo Geocoding (public, no API key).
 * Used only to turn a typed place name into coordinates.
 *
 * Never send reporter details, incident text, emails, or phone numbers here.
 */
import { env } from "@/lib/env"
import { fetchPublicJson } from "@/lib/public-http"
import type { LocationSuggestion } from "@/lib/locations"

const MAX_QUERY_LENGTH = 80
const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 8

export type GeocodePlace = LocationSuggestion & {
  countryCode: string
}

function geocodeBase(): URL {
  return new URL(env.geocodeApiBase)
}

/** Strip control chars and reject values that look like URLs or scripts. */
export function sanitizePlaceQuery(raw: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)

  if (!cleaned) return ""
  if (/https?:\/\//i.test(cleaned)) return ""
  if (/[<>]/.test(cleaned)) return ""
  if (!/[a-zA-Z]/.test(cleaned)) return ""
  return cleaned
}

function sanitizeLabel(value: unknown): string {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseGeocodePayload(data: unknown): GeocodePlace[] {
  if (!data || typeof data !== "object") return []
  const results = (data as { results?: unknown }).results
  if (!Array.isArray(results)) return []

  const places: GeocodePlace[] = []
  for (const item of results) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    if (!isFiniteNumber(row.latitude) || !isFiniteNumber(row.longitude)) continue
    if (row.latitude < -90 || row.latitude > 90) continue
    if (row.longitude < -180 || row.longitude > 180) continue

    const countryCode =
      typeof row.country_code === "string"
        ? row.country_code.toUpperCase()
        : ""
    if (countryCode !== "KE") continue

    const name = sanitizeLabel(row.name)
    if (!name) continue
    const admin = sanitizeLabel(row.admin1)
    const label = admin && admin !== name ? `${name}, ${admin}` : name

    places.push({
      label,
      lat: Number(row.latitude.toFixed(5)),
      lng: Number(row.longitude.toFixed(5)),
      countryCode,
    })
    if (places.length >= MAX_RESULTS) break
  }
  return places
}

export async function searchKenyanPlaces(
  query: string,
  signal?: AbortSignal
): Promise<GeocodePlace[]> {
  const q = sanitizePlaceQuery(query)
  if (q.length < MIN_QUERY_LENGTH) return []

  const url = new URL("/v1/search", geocodeBase())
  url.searchParams.set("name", q)
  url.searchParams.set("count", String(MAX_RESULTS))
  url.searchParams.set("language", "en")
  url.searchParams.set("format", "json")
  url.searchParams.set("countryCode", "KE")

  return fetchPublicJson(url, parseGeocodePayload, { signal })
}

export const GEOCODE_ATTRIBUTION = "Place search by Open-Meteo"
