import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { RoleGuard } from "@/components/auth/role-guard"
import { ActiveReportStatus } from "@/components/user/active-report-status"
import { CitizenMapMarker } from "@/components/user/citizen-map-marker"
import { EmergencyReportButton } from "@/components/user/emergency-report-button"
import { UserShell } from "@/components/user/user-shell"
import { Map, MapControls } from "@/components/ui/map"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLES } from "@/lib/rbac"
import {
  fetchCommunityMapIncidents,
  fetchMyIncidents,
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

  if (!user) return null

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
      {/* Map hero - community reports (same API as Map page) */}
      <section className="relative h-[min(38vh,280px)] overflow-hidden bg-muted sm:h-[min(42vh,340px)] md:h-[min(48vh,420px)]">
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
          className="absolute right-4 bottom-4 z-10 flex size-11 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-white shadow-elevated transition-colors hover:bg-[var(--ajali-primary-hover)]"
          aria-label="Open community map"
        >
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Emergency CTA + your active report status */}
      <section className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 py-8 md:py-12">
        <EmergencyReportButton />

        {loading ? (
          <Skeleton className="h-36 w-full max-w-md rounded-2xl" />
        ) : (
          <ActiveReportStatus incidents={myIncidents} />
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
