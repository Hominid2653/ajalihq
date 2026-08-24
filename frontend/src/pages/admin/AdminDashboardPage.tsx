import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowRight, ChartNoAxesCombined, ChevronRight, Search, TriangleAlert, UserRound } from "lucide-react"

import { AdminShell, adminRailClass } from "@/components/admin/admin-shell"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  Map,
  MapControls,
} from "@/components/ui/map"
import { IncidentMapMarker } from "@/components/admin/incident-map-marker"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { incidentApi } from "@/services/incident-api"
import type { Incident } from "@/types/incident"
import { statusLabel, typeLabel } from "@/types/incident"

/** Kenya overview - matches operational map framing */
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

  /** Reporters on VERIFIED or IN_PROGRESS incidents - newest activity first */
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

  const liveTotal = incidents.filter((item) => !item.archived).length

  return (
    <AdminShell
      title="Dashboard"
      hideBreadcrumbs
      flush
      end={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-9" asChild>
            <Link to="/admin/analytics" aria-label="Open analytics">
              <ChartNoAxesCombined className="size-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="size-9" asChild>
            <Link to="/admin/incidents" aria-label="Search incidents">
              <Search className="size-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="relative h-[min(38vh,280px)] shrink-0 overflow-hidden bg-muted sm:h-[min(42vh,340px)] md:h-auto md:min-h-0 md:flex-1">
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
                <IncidentMapMarker key={incident.id} incident={incident} />
              ))}
            </Map>
          )}

          <Link
            to="/admin/map"
            className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-white shadow-elevated transition-colors hover:bg-[var(--ajali-primary-hover)] md:hidden"
            aria-label="Open operations map"
          >
            <ArrowRight className="size-5" />
          </Link>
          <Link
            to="/admin/map"
            className="absolute right-4 bottom-4 z-10 hidden h-9 items-center border border-border bg-[var(--ajali-surface)] px-3 text-sm font-medium hover:bg-muted md:inline-flex"
          >
            Open map
          </Link>

          {!loading && mapped.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-background/40">
              <p className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground shadow">
                No mapped incidents yet
              </p>
            </div>
          ) : null}
        </section>

        <section className={adminRailClass}>
          {error ? (
            <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
          ) : null}

          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">Operations</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Latest reports and active reporters sit beside the Kenya overview.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight md:text-sm md:font-medium">
                Latest reports
              </h2>
              <Link
                to="/admin/incidents"
                className="text-sm font-semibold text-[var(--ajali-primary)] hover:underline"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : latestReports.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No reports available</p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
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
            {latestReports.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                1 - {latestReports.length} of {liveTotal}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight md:text-sm md:font-medium">
                Newest users
              </h2>
              <Link
                to="/admin/incidents?ops=active"
                className="text-sm font-semibold text-[var(--ajali-primary)] hover:underline"
              >
                View all
              </Link>
            </div>
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
              <p className="py-4 text-sm text-muted-foreground">
                No verified or in-progress reporters yet
              </p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
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
            {activeReporters.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                1 - {activeReporters.length} of {activeReporterTotal}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </AdminShell>
  )
}

export { AdminDashboardPage }
