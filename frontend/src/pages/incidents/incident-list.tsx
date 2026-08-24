import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search } from "lucide-react"

import { listIncidents } from "@/api/incidents"
import { AddReportButton } from "@/components/user/add-report-button"
import {
  ReportsDesktopTable,
  ReportsMobileList,
} from "@/components/user/reports-responsive-list"
import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isUnsetStatus,
  statusLabel,
  typeLabel,
  type Incident,
} from "@/lib/incidents"

function IncidentsListPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    listIncidents()
      .then(setIncidents)
      .catch((err: unknown) => {
        setIncidents([])
        setError(err instanceof Error ? err.message : "Failed to load incidents")
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(
    () => ({
      total: incidents.length,
      pending: incidents.filter((i) => isUnsetStatus(i.status)).length,
      resolved: incidents.filter((i) => i.status === "RESOLVED").length,
    }),
    [incidents]
  )

  const pending = useMemo(
    () =>
      incidents
        .filter((incident) => !incident.archived && isUnsetStatus(incident.status))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [incidents]
  )

  const statItems = [
    { label: "Total", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "Resolved", value: stats.resolved },
  ] as const

  return (
    <UserShell
      title="My incidents"
      flush
      end={
        <div className="flex items-center gap-2">
          <Button size="sm" className="hidden font-semibold md:inline-flex" asChild>
            <Link to="/incidents/new">
              <Plus className="size-4" />
              Report
            </Link>
          </Button>
          <Link to="/search" aria-label="Search incidents">
            <Search className="size-5 text-foreground" />
          </Link>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:min-w-0 md:overflow-y-auto md:px-6 md:py-6">
          <section className="grid grid-cols-3 gap-2 sm:gap-3 md:hidden">
            {statItems.map(({ label, value }) => (
              <Card key={label} size="sm" className="text-center">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[11px] text-muted-foreground sm:text-xs">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1 pb-3">
                  {loading ? (
                    <Skeleton className="mx-auto h-8 w-10" />
                  ) : (
                    <p className="text-xl font-bold sm:text-2xl">{value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          {loading ? (
            <>
              <div className="grid gap-2 md:hidden">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
              <Skeleton className="hidden h-64 w-full rounded-xl md:block" />
            </>
          ) : error ? (
            <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-8 md:min-h-64 md:justify-center">
              <p className="text-sm text-muted-foreground">
                You haven&apos;t submitted any incidents yet.
              </p>
              <Button asChild>
                <Link to="/incidents/new">Report an incident</Link>
              </Button>
            </div>
          ) : (
            <>
              <ReportsMobileList incidents={incidents} />
              <ReportsDesktopTable
                incidents={incidents}
                className="md:rounded-none md:border-0"
              />
              <p className="text-sm text-muted-foreground md:hidden">
                {incidents.length} incident{incidents.length === 1 ? "" : "s"}
              </p>
            </>
          )}
        </div>

        <aside className="hidden w-[22rem] shrink-0 flex-col gap-6 overflow-y-auto border-l border-border px-6 py-6 md:flex lg:w-[26rem]">
          <div>
            <p className="text-sm text-muted-foreground">Your reports</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Incidents
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Track every report from first submit through review and
              resolution.
            </p>
          </div>

          <div className="border-t border-border">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between border-b border-border py-3"
              >
                <p className="text-sm">{item.label}</p>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-lg font-semibold tabular-nums">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          <Button className="h-11 font-semibold" asChild>
            <Link to="/incidents/new">Report an incident</Link>
          </Button>

          <div className="min-h-0 flex-1">
            <h3 className="text-sm font-medium">Waiting for review</h3>
            {loading ? (
              <Skeleton className="mt-3 h-32 w-full" />
            ) : pending.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Nothing is waiting on review right now.
              </p>
            ) : (
              <ul className="mt-3 border-t border-border">
                {pending.map((incident) => (
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
        </aside>
      </div>
      <AddReportButton className="md:hidden" />
    </UserShell>
  )
}

export { IncidentsListPage }
