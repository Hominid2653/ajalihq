import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { RoleGuard } from "@/components/auth/role-guard"
import {
  ActiveReportStatus,
  pickActiveReport,
} from "@/components/user/active-report-status"
import { CitizenMapMarker } from "@/components/user/citizen-map-marker"
import { EmergencyReportButton } from "@/components/user/emergency-report-button"
import { UserShell } from "@/components/user/user-shell"
import { Map, MapControls } from "@/components/ui/map"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLES } from "@/lib/rbac"
import {
  fetchCommunityMapIncidents,
  fetchMyIncidents,
  statusLabel,
  typeLabel,
  type Incident,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

const NAIROBI: [number, number] = [36.8172, -1.2864]

function DashboardPage() {
  const { user } = useAuth()
  const [myIncidents, setMyIncidents] = useState<Incident[]>([])
  const [mapPins, setMapPins] = useState<
    (Incident & { lat: number; lng: number })[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchMyIncidents(user.id),
      fetchCommunityMapIncidents(),
    ])
      .then(([mine, community]) => {
        setMyIncidents(mine)
        setMapPins(community)
      })
      .catch(() => {
        setMyIncidents([])
        setMapPins([])
      })
      .finally(() => setLoading(false))
  }, [user])

  const firstName = user?.name.split(" ")[0] ?? "there"
  const active = pickActiveReport(myIncidents)
  const recent = useMemo(
    () =>
      [...myIncidents]
        .filter((incident) => !incident.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [myIncidents]
  )

  if (!user) return null

  return (
    <UserShell
      title="Dashboard"
      flush
      end={
        <div className="flex items-center gap-3">
          <Link
            to="/incidents"
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
          >
            My incidents
          </Link>
          <RoleGuard roles={[ROLES.ADMIN]}>
            <Link
              to="/admin"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Admin
            </Link>
          </RoleGuard>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="relative h-[min(38vh,280px)] shrink-0 overflow-hidden bg-muted sm:h-[min(42vh,340px)] md:h-auto md:min-h-0 md:flex-1">
          <Map
            center={NAIROBI}
            zoom={11.5}
            theme="light"
            className="absolute inset-0 size-full rounded-none"
          >
            <MapControls
              position="bottom-left"
              showZoom
              showLocate={false}
              showFullscreen={false}
            />
            {mapPins.map((incident) => (
              <CitizenMapMarker
                key={incident.id}
                incident={incident}
                showLabel={false}
                compact
              />
            ))}
          </Map>
          <Link
            to="/map"
            className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-white shadow-elevated transition-colors hover:bg-[var(--ajali-primary-hover)] md:hidden"
            aria-label="Open community map"
          >
            <ArrowRight className="size-5" />
          </Link>
          <Link
            to="/map"
            className="absolute right-4 bottom-4 z-10 hidden h-9 items-center border border-border bg-[var(--ajali-surface)] px-3 text-sm font-medium hover:bg-muted md:inline-flex"
          >
            Open map
          </Link>
        </section>

        <section className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 py-8 md:mx-0 md:w-[22rem] md:max-w-none md:flex-none md:items-stretch md:justify-start md:gap-6 md:overflow-y-auto md:border-l md:border-border md:px-6 md:py-6 lg:w-[26rem]">
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {firstName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Report what you see, then track it here while the map shows
              active community incidents.
            </p>
          </div>

          <div className="w-full md:border md:border-border md:p-5">
            <EmergencyReportButton />
          </div>

          {loading ? (
            <Skeleton className="h-36 w-full max-w-md rounded-2xl md:max-w-none" />
          ) : (
            <>
              <ActiveReportStatus
                incidents={myIncidents}
                className="md:max-w-none"
              />
              {!active ? (
                <div className="hidden w-full border border-border p-4 md:block">
                  <p className="text-sm font-medium">No active report</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    When you submit an emergency, its status will show here.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="hidden min-h-0 flex-1 flex-col md:flex">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-medium">Your reports</h3>
              <Link
                to="/incidents"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <Skeleton className="mt-3 h-40 w-full" />
            ) : recent.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                You have not submitted a report yet.
              </p>
            ) : (
              <ul className="mt-3 border-t border-border">
                {recent.map((incident) => (
                  <li key={incident.id} className="border-b border-border">
                    <Link
                      to={`/incidents/${incident.id}`}
                      className="block py-3 hover:bg-muted/40"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {incident.title}
                        </p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {statusLabel(incident.status)}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {incident.reference} · {typeLabel(incident.type)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/incidents"
            className="text-sm font-semibold text-primary hover:underline sm:hidden"
          >
            View my incidents →
          </Link>
        </section>
      </div>
    </UserShell>
  )
}

export { DashboardPage }
