/**
 * Open-Meteo Forecast (public, no API key).
 * Used only to show conditions at already-known coordinates.
 *
 * Send rounded lat/lng only. Never send incident or reporter fields.
 */
import { env } from "@/lib/env"
import { fetchPublicJson } from "@/lib/public-http"

export type SiteConditions = {
  temperatureC: number | null
  windKmh: number | null
  precipitationMm: number | null
  summary: string
}

function weatherBase(): URL {
  return new URL(env.weatherApiBase)
}

export function sanitizeCoordinate(
  value: number,
  min: number,
  max: number
): number | null {
  if (!Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return Number(value.toFixed(4))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function weatherSummary(code: number | null): string {
  if (code === null) return "Conditions unavailable"
  if (code === 0) return "Clear"
  if (code <= 3) return "Partly cloudy"
  if (code <= 48) return "Fog"
  if (code <= 57) return "Drizzle"
  if (code <= 67) return "Rain"
  if (code <= 77) return "Snow or ice"
  if (code <= 82) return "Heavy rain"
  if (code <= 86) return "Snow showers"
  if (code <= 99) return "Thunderstorm"
  return "Mixed conditions"
}

function parseForecast(data: unknown): SiteConditions {
  if (!data || typeof data !== "object") {
    return {
      temperatureC: null,
      windKmh: null,
      precipitationMm: null,
      summary: "Conditions unavailable",
    }
  }
  const current = (data as { current?: Record<string, unknown> }).current
  const temperature = isFiniteNumber(current?.temperature_2m)
    ? current.temperature_2m
    : null
  const wind = isFiniteNumber(current?.wind_speed_10m)
    ? current.wind_speed_10m
    : null
  const rain = isFiniteNumber(current?.precipitation)
    ? current.precipitation
    : null
  const code = isFiniteNumber(current?.weather_code)
    ? current.weather_code
    : null

  return {
    temperatureC: temperature,
    windKmh: wind,
    precipitationMm: rain,
    summary: weatherSummary(code),
  }
}

export async function fetchSiteConditions(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<SiteConditions> {
  const safeLat = sanitizeCoordinate(lat, -90, 90)
  const safeLng = sanitizeCoordinate(lng, -180, 180)
  if (safeLat === null || safeLng === null) {
    throw new Error("Coordinates are not valid.")
  }

  const url = new URL("/v1/forecast", weatherBase())
  url.searchParams.set("latitude", String(safeLat))
  url.searchParams.set("longitude", String(safeLng))
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,wind_speed_10m,precipitation"
  )
  url.searchParams.set("timezone", "Africa/Nairobi")
  url.searchParams.set("wind_speed_unit", "kmh")

  return fetchPublicJson(url, parseForecast, { signal })
}

export const WEATHER_ATTRIBUTION = "Weather by Open-Meteo"
