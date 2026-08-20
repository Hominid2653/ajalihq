import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { AdminShell } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  fetchAllIncidents,
  isUnsetStatus,
  statusLabel,
  type Incident,
} from "@/lib/incidents"
import { cn } from "@/lib/utils"

function AdminDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllIncidents()
      .then(setIncidents)
      .catch(() => setError("Could not load incidents."))
  }, [])

  const stats = useMemo(() => {
    const pending = incidents.filter((i) => isUnsetStatus(i.status)).length
    const active = incidents.filter((i) => {
      const s = (i.status ?? "").toLowerCase()
      return s !== "resolved" && s !== "closed"
    }).length
    const resolved = incidents.filter((i) => i.status === "resolved").length
    return { total: incidents.length, pending, active, resolved }
  }, [incidents])

  const queue = incidents.filter((i) => isUnsetStatus(i.status)).slice(0, 5)

  return (
    <AdminShell title="Admin overview">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8">
        {error ? (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total incidents", value: stats.total },
            { label: "Needs review", value: stats.pending },
            { label: "Active", value: stats.active },
            { label: "Resolved", value: stats.resolved },
          ].map(({ label, value }) => (
            <Card key={label} size="sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xs text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 pb-3">
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Incident queue
            </h2>
            <Link
              to="/admin/incidents"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <Separator />
          {queue.length === 0 ? (
            <Card className="bg-[var(--ajali-cream)]">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No incidents awaiting review.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {queue.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/admin/incidents/${incident.id}`}
                  className="block rounded-xl bg-[var(--ajali-cream)] px-4 py-3 ring-1 ring-border/50 transition-shadow hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {incident.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {incident.location}
                      </p>
                    </div>
                    <Badge
                      variant="destructive"
                      className={cn("shrink-0 capitalize text-[10px]")}
                    >
                      {statusLabel(incident.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  )
}

export { AdminDashboardPage }
