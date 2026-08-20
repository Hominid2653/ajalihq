import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { UserShell } from "@/components/user/user-shell"
import { Badge } from "@/components/ui/badge"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from "@/components/ui/map"
import { statusLabel, type Incident } from "@/lib/incidents"
import { cn } from "@/lib/utils"
import { incidentApi } from "@/services/incident-api"

/** Nairobi CBD — default map center */
const NAIROBI: [number, number] = [36.8172, -1.2864]

function markerTone(status: string) {
  const s = (status ?? "").toLowerCase()
  if (s === "verified") return "bg-[var(--status-verified)]"
  if (s === "in_progress") {
    return "bg-[var(--status-progress)]"
  }
  if (s === "resolved") return "bg-[var(--status-resolved)]"
  if (s === "closed") return "bg-[var(--status-closed)]"
  return "bg-[var(--ajali-primary)]"
}

function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    incidentApi.getActive()
      .then(setIncidents)
      .catch(() => setIncidents([]))
  }, [])

  const active = useMemo(
    () =>
      incidents.filter(
        (incident): incident is Incident & { lat: number; lng: number } =>
          incident.lat !== null && incident.lng !== null
      ),
    [incidents]
  )

  return (
    <UserShell
      bleed
      title={
        <>
          <span
            className="size-2 shrink-0 rounded-full bg-[var(--ajali-primary)]"
            aria-hidden
          />
          <span className="truncate">Active incidents</span>
          <Badge
            variant="default"
            className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
          >
            {active.length}
          </Badge>
        </>
      }
      end={
        <Link to="/search" aria-label="Search reports" className="md:hidden">
          <Search className="size-5 text-foreground" />
        </Link>
      }
    >
      <div className="relative min-h-0 flex-1 bg-muted">
        <Map
          center={NAIROBI}
          zoom={12}
          theme="light"
          className="absolute inset-0 size-full rounded-none"
        >
          <MapControls
            position="bottom-right"
            showZoom
            showLocate
            showFullscreen
            className="mb-20 md:mb-4"
          />

          {active.map((incident) => (
            <MapMarker
              key={incident.id}
              longitude={incident.lng}
              latitude={incident.lat}
            >
              <MarkerContent>
                <span
                  className={cn(
                    "block size-3.5 rounded-full border-2 border-white shadow-md ring-1 ring-black/10",
                    markerTone(incident.status)
                  )}
                  aria-hidden
                />
              </MarkerContent>
              <MarkerPopup closeButton className="min-w-[200px] max-w-[260px]">
                <div className="space-y-1 p-1">
                  <p className="text-sm font-semibold text-foreground">
                    {incident.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {incident.location}
                  </p>
                  <p className="text-xs font-medium capitalize text-primary">
                    {statusLabel(incident.status)}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>

        <AddReportButton
          searchHref="/search"
          className="inset-x-auto right-4 justify-end"
        />
      </div>
    </UserShell>
  )
}

export { MapPage }
