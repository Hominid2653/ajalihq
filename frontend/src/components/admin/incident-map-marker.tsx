import { Link } from "react-router-dom"
import { format } from "date-fns"

import { SeverityBadge, StatusBadge, UrgencyBadge } from "@/components/admin/status-badge"
import { MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map"
import type { Incident, IncidentStatus, IncidentUrgency } from "@/types/incident"
import { typeLabel } from "@/types/incident"
import { cn } from "@/lib/utils"

function markerTone(status: IncidentStatus, urgency: IncidentUrgency) {
  if (urgency === "CRITICAL") {
    return "bg-[var(--urgency-critical)] ring-2 ring-[var(--urgency-critical)]/40"
  }
  return {
    PENDING: "bg-[var(--status-pending)]",
    VERIFIED: "bg-[var(--status-verified)]",
    IN_PROGRESS: "bg-[var(--status-progress)]",
    RESOLVED: "bg-[var(--status-resolved)]",
    CLOSED: "bg-[var(--status-closed)]",
  }[status]
}

type IncidentMapMarkerProps = {
  incident: Incident & { lat: number; lng: number }
  /** Richer popup (ops map) vs compact (dashboard) */
  detailed?: boolean
}

/** Shared admin map pin — status/urgency color dot used across admin maps. */
function IncidentMapMarker({ incident, detailed = false }: IncidentMapMarkerProps) {
  return (
    <MapMarker longitude={incident.lng} latitude={incident.lat}>
      <MarkerContent>
        <button
          type="button"
          className={cn(
            "block size-4 rounded-full border-2 border-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            markerTone(incident.status, incident.urgency)
          )}
          aria-label={`${incident.reference} ${typeLabel(incident.type)} ${incident.status}`}
        />
      </MarkerContent>
      <MarkerPopup>
        <div className="space-y-2 p-1 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{incident.reference}</p>
          <p className="font-semibold">{typeLabel(incident.type)}</p>
          <p className="text-muted-foreground">{incident.location}</p>
          {detailed ? (
            <>
              <p className="text-xs text-muted-foreground">
                {format(new Date(incident.createdAt), "d MMM yyyy, h:mm a")}
              </p>
              <div className="flex flex-wrap gap-2">
                <UrgencyBadge urgency={incident.urgency} />
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
            </>
          ) : (
            <StatusBadge status={incident.status} />
          )}
          <Link
            className="inline-block text-xs font-semibold text-primary"
            to={`/admin/incidents/${incident.id}`}
          >
            View incident →
          </Link>
        </div>
      </MarkerPopup>
    </MapMarker>
  )
}

export { IncidentMapMarker, markerTone }
