import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowRight, ChevronRight, MapPin, Search, TriangleAlert, UserRound } from "lucide-react"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from "@/components/ui/map"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { incidentApi } from "@/services/incident-api"
import type { Incident } from "@/types/incident"
import { statusLabel, typeLabel } from "@/types/incident"
import { cn } from "@/lib/utils"

/** Kenya overview — matches operational map framing */
const KENYA: [number, number] = [37.0, -0.5]

type ActiveReporter = {
  key: string
  name: string
  contact?: string
  incidentId: string
  reference: string
  status: Incident["status"]
  updatedAt: string
}

function AdminDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    incidentApi
      .getAll()
      .then(setIncidents)
      .catch(() => setError("Could not load the operations dashboard."))
      .finally(() => setLoading(false))
  }, [])

  const mapped = useMemo(
    () =>
      incidents.filter(
        (item): item is Incident & { lat: number; lng: number } =>
          item.lat !== null && item.lng !== null && !item.archived
      ),
    [incidents]
  )

  const latestReports = useMemo(
    () =>
      [...incidents]
        .filter((item) => !item.archived)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [incidents]
  )

  /** Reporters on VERIFIED or IN_PROGRESS incidents — newest activity first */
  const activeReporters = useMemo(() => {
    const active = incidents
      .filter(
        (item) =>
          !item.archived &&
          (item.status === "VERIFIED" || item.status === "IN_PROGRESS")
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const seen = new Set<string>()
    const rows: ActiveReporter[] = []
    for (const item of active) {
      const key = item.userId || item.reporterEmail || item.reporterPhone || item.id
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        key,
        name: item.reporterName || "Anonymous reporter",
        contact: item.reporterPhone || item.reporterEmail,
        incidentId: item.id,
        reference: item.reference,
        status: item.status,
        updatedAt: item.updatedAt,
      })
      if (rows.length >= 6) break
    }
    return rows
  }, [incidents])

  const activeReporterTotal = useMemo(() => {
    const keys = new Set<string>()
    for (const item of incidents) {
      if (
        item.archived ||
        (item.status !== "VERIFIED" && item.status !== "IN_PROGRESS")
      ) {
        continue
      }
      keys.add(item.userId || item.reporterEmail || item.reporterPhone || item.id)
    }
    return keys.size
  }, [incidents])

  return (
    <AdminShell
      title="Dashboard"
      hideBreadcrumbs
      end={
        <Button variant="ghost" size="icon" className="size-9" asChild>
          <Link to="/admin/incidents" aria-label="Search incidents">
            <Search className="size-4" />
          </Link>
        </Button>
      }
    >
      <AdminPage wide className="flex flex-col gap-8 pb-4">
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
        ) : null}

        {/* ── Hero map ── */}
        <section className="relative overflow-hidden rounded-2xl border bg-muted shadow-[var(--shadow-card)]">
          <div className="relative h-[min(52vh,28rem)] w-full min-h-[240px] sm:h-[min(56vh,32rem)]">
            {loading ? (
              <Skeleton className="absolute inset-0 size-full rounded-none" />
            ) : (
              <Map
                center={KENYA}
                zoom={6}
                theme="light"
                className="absolute inset-0 size-full rounded-none"
              >
                <MapControls position="bottom-left" showZoom showLocate={false} showFullscreen={false} />
                {mapped.map((incident) => (
                  <MapMarker
                    key={incident.id}
                    longitude={incident.lng}
                    latitude={incident.lat}
                  >
                    <MarkerContent>
                      <button
                        type="button"
                        className="group relative flex size-9 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`${incident.reference} ${typeLabel(incident.type)}`}
                      >
                        <MapPin
                          className={cn(
                            "size-8 fill-[var(--ajali-primary)] text-[var(--ajali-primary)] drop-shadow-md transition-transform group-hover:scale-110",
                            incident.urgency === "CRITICAL" &&
                              "fill-[var(--urgency-critical)] text-[var(--urgency-critical)]"
                          )}
                          strokeWidth={1.25}
                        />
                      </button>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="space-y-2 p-1 text-sm">
                        <p className="font-mono text-xs text-muted-foreground">{incident.reference}</p>
                        <p className="font-semibold">{typeLabel(incident.type)}</p>
                        <p className="text-muted-foreground">{incident.location}</p>
                        <StatusBadge status={incident.status} />
                        <Link
                          className="inline-block text-xs font-semibold text-primary"
                          to={`/admin/incidents/${incident.id}`}
                        >
                          View incident →
                        </Link>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                ))}
              </Map>
            )}

            {/* Floating affordance → full ops map (matches Figma arrow control) */}
            <Button
              size="icon"
              className="absolute top-1/2 right-3 z-10 size-11 -translate-y-1/2 rounded-full bg-[var(--ajali-primary)] text-white shadow-lg hover:bg-[var(--ajali-primary-hover)]"
              asChild
            >
              <Link to="/admin/map" aria-label="Open operations map">
                <ArrowRight className="size-5" />
              </Link>
            </Button>

            {!loading && mapped.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-background/40">
                <p className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground shadow">
                  No mapped incidents yet
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Latest reports | Newest users ── */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-bold tracking-tight">Latest reports</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : latestReports.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">No reports available</p>
            ) : (
              <ul className="divide-y divide-border">
                {latestReports.map((report) => (
                  <li key={report.id}>
                    <Link
                      to={`/admin/incidents/${report.id}/review`}
                      className="flex items-center gap-3 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--ajali-cream)] text-[var(--ajali-primary)]">
                        <TriangleAlert className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{typeLabel(report.type)}</p>
                        <p className="truncate text-xs text-muted-foreground">{report.location}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(report.createdAt), "d MMM")}
                      </span>
                      <StatusBadge status={report.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {latestReports.length > 0
                  ? `1 – ${latestReports.length} of ${incidents.filter((i) => !i.archived).length}`
                  : null}
              </span>
              <Link to="/admin/incidents" className="font-semibold text-[var(--ajali-primary)] hover:underline">
                View all
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold tracking-tight">Newest users</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Reporters on verified or in-progress incidents
            </p>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : activeReporters.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                No verified or in-progress reporters yet
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {activeReporters.map((user) => (
                  <li key={user.key}>
                    <Link
                      to={`/admin/incidents/${user.incidentId}/review`}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <UserRound className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.reference} · {user.contact || statusLabel(user.status)}
                        </p>
                      </div>
                      <StatusBadge status={user.status} />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {activeReporters.length > 0
                  ? `1 – ${activeReporters.length} of ${activeReporterTotal}`
                  : null}
              </span>
              <Link
                to="/admin/incidents?status=IN_PROGRESS"
                className="font-semibold text-[var(--ajali-primary)] hover:underline"
              >
                View all
              </Link>
            </div>
          </div>
        </section>
      </AdminPage>
    </AdminShell>
  )
}

export { AdminDashboardPage }
