import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { getSession } from "@/lib/auth"
import { fetchIncidents, type Incident } from "@/lib/incidents"

function DashboardPage() {
  const session = getSession()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIncidents()
      .then(setIncidents)
      .catch(() => {
        setError("Could not load reports.")
        setIncidents([])
      })
  }, [])

  if (!session) return null

  const recent = incidents.slice(0, 10)

  return (
    <UserShell
      title="Dashboard"
      end={
        session.role === "admin" ? (
          <Link to="/coming-soon">Admin</Link>
        ) : (
          <span className="inline-block w-10" />
        )
      }
    >
      <section className="relative h-[220px] overflow-hidden bg-neutral-200">
        <img
          src="/splash.png"
          alt=""
          className="size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 ring-1 ring-white/30"
        />
        <Link
          to="/map"
          className="absolute right-4 bottom-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
          aria-label="Open map"
        >
          <ArrowRight className="size-5" />
        </Link>
      </section>

      <section className="flex flex-col gap-3 px-4 py-5">
        <h2 className="text-sm font-bold text-neutral-900">My recent reports</h2>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : recent.length === 0 ? (
          <p className="rounded-xl bg-[#f2efe8] px-4 py-8 text-center text-sm text-neutral-500">
            No reports yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((incident) => (
              <ReportRow key={incident.id} incident={incident} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <p className="text-neutral-500">
            1-{recent.length} of {incidents.length}
          </p>
          <Link className="font-semibold text-primary" to="/reports">
            View all
          </Link>
        </div>
      </section>

      <AddReportButton />
    </UserShell>
  )
}

export { DashboardPage }
