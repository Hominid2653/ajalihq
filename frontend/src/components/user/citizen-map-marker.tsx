import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/incidents/status-badge"
import {
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "@/components/ui/map"
import {
  isResolvedStatus,
  statusLabel,
  typeLabel,
  type Incident,
} from "@/lib/incidents"
import { cn } from "@/lib/utils"

function citizenMarkerTone(status: Incident["status"]) {
  switch (status) {
    case "VERIFIED":
      return "bg-[var(--status-verified)]"
    case "IN_PROGRESS":
      return "bg-[var(--status-progress)]"
    case "RESOLVED":
      return "bg-[var(--status-resolved)]"
    default:
      return "bg-[var(--ajali-primary)]"
  }
}

type CitizenMapMarkerProps = {
  incident: Incident & { lat: number; lng: number }
  /** Type/status text above the pin (full map). */
  showLabel?: boolean
  /** Shorter popup for dashboard hero. */
  compact?: boolean
}

/** Shared citizen map pin for community reports. */
function CitizenMapMarker({
  incident,
  showLabel = true,
  compact = false,
}: CitizenMapMarkerProps) {
  const resolved = isResolvedStatus(incident.status)
  const label = typeLabel(incident.type)

  return (
    <MapMarker longitude={incident.lng} latitude={incident.lat}>
      <MarkerContent>
        <span className="relative block">
          <button
            type="button"
            className={cn(
              "block size-3.5 rounded-full border-2 border-white shadow-md ring-1 ring-black/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              citizenMarkerTone(incident.status)
            )}
            aria-label={`${label}, ${statusLabel(incident.status)}, ${incident.location}`}
          />
          {showLabel ? (
            <MarkerLabel
              position="top"
              className={cn(
                "rounded bg-background/95 px-1.5 py-0.5 shadow-sm ring-1 ring-border",
                resolved && "text-[var(--status-resolved)]"
              )}
            >
              {label}
              {resolved ? " · Resolved" : ""}
            </MarkerLabel>
          ) : null}
        </span>
      </MarkerContent>
      <MarkerPopup closeButton className="min-w-[200px] max-w-[260px]">
        <div className="space-y-2 p-1 text-sm">
          <p className="font-mono text-xs text-muted-foreground">
            {incident.reference}
          </p>
          <p className="font-semibold">{incident.title}</p>
          <p className="text-xs text-muted-foreground">{incident.location}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} />
            {!compact ? (
              <span className="text-xs text-muted-foreground">{label}</span>
            ) : null}
          </div>
          {resolved ? (
            <p className="text-xs font-medium text-[var(--status-resolved)]">
              This report has been resolved.
            </p>
          ) : null}
          <Link
            to={`/incidents/${incident.id}`}
            className="inline-block text-xs font-semibold text-primary hover:underline"
          >
            View details →
          </Link>
        </div>
      </MarkerPopup>
    </MapMarker>
  )
}

export { CitizenMapMarker, citizenMarkerTone }
