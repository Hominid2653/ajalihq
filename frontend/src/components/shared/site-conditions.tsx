import { useSiteConditions } from "@/hooks/use-site-conditions"
import { WEATHER_ATTRIBUTION } from "@/services/weather-api"

function formatValue(value: number | null, suffix: string) {
  if (value === null) return "-"
  return `${Math.round(value)}${suffix}`
}

function SiteConditionsCard({
  lat,
  lng,
}: {
  lat: number | null
  lng: number | null
}) {
  const { conditions, loading, error } = useSiteConditions(lat, lng)

  if (lat === null || lng === null) return null

  return (
    <div className="rounded-xl bg-ajali-cream p-4 ring-1 ring-border/60">
      <p className="text-sm font-semibold text-foreground">On-site conditions</p>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading live weather…</p>
      ) : error ? (
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      ) : conditions ? (
        <dl className="mt-2 grid gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between gap-4">
            <dt>Summary</dt>
            <dd className="font-medium text-foreground">{conditions.summary}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Temperature</dt>
            <dd className="font-medium text-foreground">
              {formatValue(conditions.temperatureC, "°C")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Wind</dt>
            <dd className="font-medium text-foreground">
              {formatValue(conditions.windKmh, " km/h")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Rain</dt>
            <dd className="font-medium text-foreground">
              {formatValue(conditions.precipitationMm, " mm")}
            </dd>
          </div>
        </dl>
      ) : null}
      <p className="mt-3 text-[11px] text-muted-foreground">
        {WEATHER_ATTRIBUTION}. Coordinates are rounded before the request.
        Report details are not sent.
      </p>
    </div>
  )
}

export { SiteConditionsCard }
