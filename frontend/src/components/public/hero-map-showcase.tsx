import { useEffect, useMemo, useState } from "react"
import {
  faMap,
  faMapLocationDot,
} from "@fortawesome/free-solid-svg-icons"

import { CitizenMapMarker } from "@/components/user/citizen-map-marker"
import { FaIcon } from "@/components/ui/fa-icon"
import { Map } from "@/components/ui/map"
import { fetchCommunityMapIncidents } from "@/lib/incidents"
import type { Incident } from "@/lib/incidents"
import { cn } from "@/lib/utils"

/** Nairobi CBD — default showcase center */
const KENYA_CENTER: [number, number] = [36.82, -1.29]

/** Fallback pins when the API is empty or unavailable. */
const DEMO_INCIDENTS: (Incident & { lat: number; lng: number })[] = [
  {
    id: "demo-1",
    reference: "AJL-0024",
    title: "Traffic collision on highway",
    description: "Multi-vehicle accident blocking lanes.",
    type: "accident",
    urgency: "HIGH",
    severity: "MAJOR",
    status: "IN_PROGRESS",
    location: "Uhuru Highway, Nairobi",
    lat: -1.2921,
    lng: 36.8219,
    userId: "demo",
    archived: false,
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T11:30:00.000Z",
  },
  {
    id: "demo-2",
    reference: "AJL-0021",
    title: "Market fire",
    description: "Smoke visible from Gikomba market.",
    type: "fire",
    urgency: "CRITICAL",
    severity: "CRITICAL",
    status: "VERIFIED",
    location: "Gikomba, Nairobi",
    lat: -1.2835,
    lng: 36.8382,
    userId: "demo",
    archived: false,
    createdAt: "2026-08-28T14:00:00.000Z",
    updatedAt: "2026-08-28T14:45:00.000Z",
  },
  {
    id: "demo-3",
    reference: "AJL-0018",
    title: "Flooding after heavy rain",
    description: "Road impassable near lakefront.",
    type: "disaster",
    urgency: "MEDIUM",
    severity: "MODERATE",
    status: "RESOLVED",
    location: "Kisumu CBD",
    lat: -0.1022,
    lng: 34.7617,
    userId: "demo",
    archived: false,
    createdAt: "2026-08-27T08:00:00.000Z",
    updatedAt: "2026-08-27T16:00:00.000Z",
  },
  {
    id: "demo-4",
    reference: "AJL-0014",
    title: "Medical emergency",
    description: "Pedestrian assistance requested.",
    type: "medical",
    urgency: "HIGH",
    severity: "MAJOR",
    status: "IN_PROGRESS",
    location: "Nyali, Mombasa",
    lat: -4.0435,
    lng: 39.7306,
    userId: "demo",
    archived: false,
    createdAt: "2026-08-26T12:00:00.000Z",
    updatedAt: "2026-08-26T12:20:00.000Z",
  },
]

const LEGEND = [
  { label: "In progress", color: "bg-[var(--status-progress)]" },
  { label: "Verified", color: "bg-[var(--status-verified)]" },
  { label: "Resolved", color: "bg-[var(--status-resolved)]" },
] as const

type HeroMapShowcaseProps = {
  className?: string
}

function HeroMapShowcase({ className }: HeroMapShowcaseProps) {
  const [incidents, setIncidents] = useState<(Incident & { lat: number; lng: number })[]>(
    DEMO_INCIDENTS
  )
  const [usingLiveData, setUsingLiveData] = useState(false)

  useEffect(() => {
    fetchCommunityMapIncidents()
      .then((items) => {
        if (items.length > 0) {
          setIncidents(items)
          setUsingLiveData(true)
        }
      })
      .catch(() => {
        setIncidents(DEMO_INCIDENTS)
        setUsingLiveData(false)
      })
  }, [])

  const counts = useMemo(() => {
    const active = incidents.filter((i) => i.status === "IN_PROGRESS").length
    const verified = incidents.filter((i) => i.status === "VERIFIED").length
    return { total: incidents.length, active, verified }
  }, [incidents])

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-md">
        <div className="flex items-center gap-3 border-b border-border bg-[var(--ajali-surface-muted)] px-4 py-2.5">
          <div className="flex shrink-0 gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex h-7 w-full max-w-sm items-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
            <FaIcon icon={faMap} className="mr-2 text-[10px] text-[var(--ajali-primary)]" />
            <span className="truncate">ajalihq.vercel.app/map</span>
          </div>
        </div>

        <div className="relative h-[min(26rem,58vw)] min-h-[280px] w-full">
          <Map
            className="absolute inset-0 h-full w-full"
            center={KENYA_CENTER}
            zoom={6.2}
            scrollZoom={false}
            dragPan
            attributionControl={false}
          >
            {incidents.map((incident) => (
              <CitizenMapMarker
                key={incident.id}
                incident={incident}
                showLabel={incidents.length <= 6}
                compact
              />
            ))}
          </Map>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2 sm:bottom-4 sm:left-4 sm:right-4">
            <div className="rounded-md border border-border bg-background p-3 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">On map</p>
              <div className="mt-1 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold tabular-nums">{counts.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">{counts.active}</p>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">{counts.verified}</p>
                  <p className="text-[10px] text-muted-foreground">Verified</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 rounded-md border border-border bg-background px-3 py-2 shadow-sm">
              {LEGEND.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"
                >
                  <span className={cn("size-2 rounded-full", item.color)} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        <FaIcon icon={faMapLocationDot} className="mr-1.5 text-[var(--ajali-primary)]" />
        {usingLiveData
          ? "Live community incidents from Ajali! operations data"
          : "Representative incidents shown for demonstration"}
      </p>
    </div>
  )
}

export { HeroMapShowcase }
