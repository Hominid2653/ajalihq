import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { CitizenMapMarker } from "@/components/user/citizen-map-marker"
import { UserShell } from "@/components/user/user-shell"
import { Badge } from "@/components/ui/badge"
import { Map, MapControls } from "@/components/ui/map"
import { fetchCommunityMapIncidents } from "@/lib/incidents"
import type { Incident } from "@/lib/incidents"

/** Nairobi CBD - default map center */
const NAIROBI: [number, number] = [36.8172, -1.2864]

function MapPage() {
  const [incidents, setIncidents] = useState<
    (Incident & { lat: number; lng: number })[]
  >([])

  useEffect(() => {
    fetchCommunityMapIncidents()
      .then(setIncidents)
      .catch(() => setIncidents([]))
  }, [])

  const counts = useMemo(() => {
    const resolved = incidents.filter((i) => i.status === "RESOLVED").length
    const active = incidents.length - resolved
    return { total: incidents.length, active, resolved }
  }, [incidents])

  return (
    <UserShell
      bleed
      title={
        <>
          <span
            className="size-2 shrink-0 rounded-full bg-[var(--ajali-primary)]"
            aria-hidden
          />
          <span className="truncate">Community incidents</span>
          <Badge
            variant="default"
            className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
          >
            {counts.total}
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

          {incidents.map((incident) => (
            <CitizenMapMarker
              key={incident.id}
              incident={incident}
              showLabel
            />
          ))}
        </Map>

        <div className="pointer-events-none absolute top-16 left-4 z-10 flex flex-wrap gap-2 md:top-5 md:left-5">
          <Badge variant="secondary" className="pointer-events-auto shadow-sm">
            Active {counts.active}
          </Badge>
          <Badge variant="outline" className="pointer-events-auto bg-background/90 shadow-sm">
            Resolved {counts.resolved}
          </Badge>
        </div>

        <AddReportButton
          searchHref="/search"
          className="inset-x-auto right-4 justify-end"
        />
      </div>
    </UserShell>
  )
}

export { MapPage }
