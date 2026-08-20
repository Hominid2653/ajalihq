import { useEffect, useMemo, useState } from "react"
import { subHours, subDays } from "date-fns"

import { AdminShell } from "@/components/admin/admin-shell"
import { IncidentMapMarker } from "@/components/admin/incident-map-marker"
import {
  Map,
  MapControls,
} from "@/components/ui/map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { incidentApi } from "@/services/incident-api"
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType, IncidentUrgency } from "@/types/incident"
import { typeLabel } from "@/types/incident"

const KENYA: [number, number] = [37.9062, -0.0236]

type TimeRange = "all" | "24h" | "7d" | "30d"

function withinTimeRange(createdAt: string, range: TimeRange) {
  if (range === "all") return true
  const created = new Date(createdAt)
  const now = new Date()
  if (range === "24h") return created >= subHours(now, 24)
  if (range === "7d") return created >= subDays(now, 7)
  return created >= subDays(now, 30)
}

function AdminMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("all")
  const [urgency, setUrgency] = useState("all")
  const [severity, setSeverity] = useState("all")
  const [type, setType] = useState("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("all")

  useEffect(() => {
    setLoading(true)
    incidentApi
      .getAll()
      .then(setIncidents)
      .catch(() => setError("Could not load map incidents."))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(
    () =>
      incidents.filter(
        (i): i is Incident & { lat: number; lng: number } =>
          i.lat !== null &&
          i.lng !== null &&
          (status === "all" || i.status === status) &&
          (urgency === "all" || i.urgency === urgency) &&
          (severity === "all" || i.severity === severity) &&
          (type === "all" || i.type === type) &&
          withinTimeRange(i.createdAt, timeRange)
      ),
    [incidents, severity, status, timeRange, type, urgency]
  )

  return (
    <AdminShell bleed title="Operations map">
      <div className="relative min-h-0 flex-1 bg-muted">
        <div className="absolute top-3 right-3 left-3 z-10 grid max-h-[42vh] gap-2 overflow-y-auto rounded-xl bg-background/95 p-3 shadow-lg backdrop-blur md:right-auto md:max-h-none md:w-[min(100%,48rem)] md:grid-cols-5 lg:w-[56rem]">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(["PENDING", "VERIFIED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as IncidentStatus[]).map((value) => (
                <SelectItem key={value} value={value}>{value.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgencies</SelectItem>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentUrgency[]).map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {(["MINOR", "MODERATE", "MAJOR", "CRITICAL"] as IncidentSeverity[]).map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(["accident", "fire", "medical", "crime", "disaster"] as IncidentType[]).map((value) => (
                <SelectItem key={value} value={value}>{typeLabel(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger><SelectValue placeholder="Time range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground md:col-span-5">
            {error ||
              (loading
                ? "Loading map…"
                : visible.length === 0
                  ? "No mapped incidents match these filters."
                  : `${visible.length} mapped incidents · markers tint by status; critical urgency uses a stronger ring`)}
          </p>
        </div>

        {loading ? (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-background/40 p-6">
            <Skeleton className="h-full w-full max-h-[70vh] rounded-xl" />
          </div>
        ) : null}

        <Map center={KENYA} zoom={5.5} theme="light" className="absolute inset-0 size-full rounded-none">
          <MapControls position="bottom-right" showZoom showLocate showFullscreen />
          {!loading &&
            visible.map((incident) => (
              <IncidentMapMarker key={incident.id} incident={incident} detailed />
            ))}
        </Map>
      </div>
    </AdminShell>
  )
}

export { AdminMapPage }
