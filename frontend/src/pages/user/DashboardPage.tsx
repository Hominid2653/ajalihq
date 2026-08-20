import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { RoleGuard } from "@/components/auth/role-guard"
import { ActiveReportStatus } from "@/components/user/active-report-status"
import { EmergencyReportButton } from "@/components/user/emergency-report-button"
import { UserShell } from "@/components/user/user-shell"
import { Map, MapMarker, MarkerContent } from "@/components/ui/map"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLES } from "@/lib/rbac"
import {
  fetchMyIncidents,
  isActiveStatus,
  type Incident,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

const NAIROBI: [number, number] = [36.8172, -1.2864]

function DashboardPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchMyIncidents(user.id)
      .then(setIncidents)
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const mapPins = incidents.filter(
    (i): i is Incident & { lat: number; lng: number } =>
      isActiveStatus(i.status) && i.lat !== null && i.lng !== null
  )

  return (
    <UserShell
      title="Dashboard"
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
      {/* Map hero */}
      <section className="relative h-[min(38vh,280px)] overflow-hidden bg-muted sm:h-[min(42vh,340px)] md:h-[min(48vh,420px)]">
        <Map
          center={NAIROBI}
          zoom={11.5}
          theme="light"
          interactive={false}
          attributionControl={false}
          className="pointer-events-none absolute inset-0 size-full rounded-none"
        >
          {mapPins.map((incident) => (
            <MapMarker
              key={incident.id}
              longitude={incident.lng}
              latitude={incident.lat}
            >
              <MarkerContent>
                <span
                  className="block size-2.5 rounded-full border-2 border-white bg-[var(--ajali-primary)] shadow-sm"
                  aria-hidden
                />
              </MarkerContent>
            </MapMarker>
          ))}
        </Map>
        <Link
          to="/map"
          className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-white shadow-elevated transition-colors hover:bg-[var(--ajali-primary-hover)]"
          aria-label="Open map"
        >
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Emergency CTA + active report status */}
      <section className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 py-8 md:py-12">
        <EmergencyReportButton />

        {loading ? (
          <Skeleton className="h-36 w-full max-w-md rounded-2xl" />
        ) : (
          <ActiveReportStatus incidents={incidents} />
        )}

        <Link
          to="/incidents"
          className="text-sm font-semibold text-primary hover:underline sm:hidden"
        >
          View my incidents →
        </Link>
      </section>
    </UserShell>
  )
}

export { DashboardPage }
