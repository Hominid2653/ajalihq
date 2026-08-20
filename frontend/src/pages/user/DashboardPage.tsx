import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth"
import { fetchIncidents, type Incident } from "@/lib/incidents"

function DashboardPage() {
  const session = getSession()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIncidents()
      .then(setIncidents)
      .catch(() => { setError("Could not load reports."); setIncidents([]) })
  }, [])

  if (!session) return null

  const recent = incidents.slice(0, 10)

  return (
    <UserShell
      title="Dashboard"
      end={
        session.role === "admin" ? (
          <Link to="/coming-soon" className="text-sm font-semibold text-primary hover:underline">
            Admin
          </Link>
        ) : undefined
      }
    >
      {/* Hero / map thumbnail */}
      <section className="relative h-[200px] overflow-hidden bg-muted sm:h-[240px] md:h-[min(42vh,420px)] md:min-h-[280px]">
        <img src="/splash.png" alt="" className="size-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 ring-1 ring-white/30 sm:size-44"
        />
        <Link
          to="/map"
          className="absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-white shadow-elevated transition-colors hover:bg-[var(--ajali-primary-hover)]"
          aria-label="Open map"
        >
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Recent reports */}
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5 md:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            My recent reports
          </h2>
          <Link
            className="hidden text-xs font-semibold text-primary hover:underline sm:inline"
            to="/reports"
          >
            View all →
          </Link>
        </div>

        <Separator />

        {error ? (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : recent.length === 0 ? (
          <Card className="bg-[var(--ajali-cream)]">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No reports yet. Tap <strong>Report</strong> to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
            {recent.map((incident) => (
              <ReportRow key={incident.id} incident={incident} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground sm:hidden">
          <span>
            Showing {recent.length} of {incidents.length}
          </span>
          <Link className="font-semibold text-primary" to="/reports">
            View all
          </Link>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Showing {recent.length} of {incidents.length} reports
        </p>
      </section>

      {/* Stats row */}
      <section className="mx-auto grid w-full max-w-4xl grid-cols-3 gap-3 px-4 pb-4 md:px-8 lg:px-10">
        {[
          { label: "Total", value: incidents.length },
          {
            label: "Pending",
            value: incidents.filter((i) => ["reported", "pending", "new"].includes((i.status ?? "").toLowerCase())).length,
          },
          {
            label: "Resolved",
            value: incidents.filter((i) => i.status === "resolved").length,
          },
        ].map(({ label, value }) => (
          <Card key={label} size="sm" className="text-center">
            <CardHeader className="pb-0">
              <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <AddReportButton />
    </UserShell>
  )
}

export { DashboardPage }
