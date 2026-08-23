/**
 * Frontend environment.
 * Values come from `frontend/.env` (Vite `VITE_*` prefix) and are baked in at build time.
 * Never put secrets here. Open-Meteo hosts are public.
 */
import { resolveAllowedBaseUrl } from "@/lib/public-http"

const GEOCODE_FALLBACK = "https://geocoding-api.open-meteo.com"
const WEATHER_FALLBACK = "https://api.open-meteo.com"

export const env = {
  geocodeApiBase: resolveAllowedBaseUrl(
    import.meta.env.VITE_GEOCODE_API_BASE,
    GEOCODE_FALLBACK
  ).origin,
  weatherApiBase: resolveAllowedBaseUrl(
    import.meta.env.VITE_WEATHER_API_BASE,
    WEATHER_FALLBACK
  ).origin,
} as const
