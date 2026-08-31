/**
 * Frontend environment.
 * Values come from `frontend/.env` (Vite `VITE_*` prefix) and are baked in at build time.
 * Never put secrets here. Open-Meteo hosts are public.
 */
import { resolveAllowedBaseUrl } from "@/lib/public-http"

const GEOCODE_FALLBACK = "https://geocoding-api.open-meteo.com"
const WEATHER_FALLBACK = "https://api.open-meteo.com"

function resolveApiBase(): string {
  const custom = import.meta.env.VITE_API_BASE
  if (typeof custom === "string" && custom.trim()) {
    return custom.trim().replace(/\/+$/, "")
  }
  // In development, default to local Flask port 5000; in production, default to Render live backend
  return import.meta.env.DEV ? "http://127.0.0.1:5000" : "https://ajalihq.onrender.com"
}

export const env = {
  apiBase: resolveApiBase(),
  useMockApi: import.meta.env.VITE_USE_MOCK_API === "true",
  geocodeApiBase: resolveAllowedBaseUrl(
    import.meta.env.VITE_GEOCODE_API_BASE,
    GEOCODE_FALLBACK
  ).origin,
  weatherApiBase: resolveAllowedBaseUrl(
    import.meta.env.VITE_WEATHER_API_BASE,
    WEATHER_FALLBACK
  ).origin,
} as const

