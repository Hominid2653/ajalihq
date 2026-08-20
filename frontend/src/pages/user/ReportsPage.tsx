import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search } from "lucide-react"

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
  fetchMyIncidents,
  isUnsetStatus,
  type Incident,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function ReportsPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    fetchMyIncidents(user.id)
      .then(setIncidents)
      .catch(() => {
        setIncidents([])
        setError("Could not load your reports.")
      })
      .finally(() => setLoading(false))
  }, [user])

  const stats = useMemo(
    () => ({
      total: incidents.length,
      pending: incidents.filter((i) => isUnsetStatus(i.status)).length,
      resolved: incidents.filter((i) => i.status === "RESOLVED").length,
    }),
    [incidents]
  )

  return (
    <UserShell
      title="My reports"
      end={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hidden font-semibold md:inline-flex"
            asChild
          >
            <Link to="/report">
              <Plus className="size-4" />
              Report
            </Link>
          </Button>
          <Link to="/search" aria-label="Search reports">
            <Search className="size-5 text-foreground" />
          </Link>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-8 lg:px-10">
        {/* Summary — moved from dashboard */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Resolved", value: stats.resolved },
          ].map(({ label, value }) => (
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
                  <p className="text-xl font-bold text-foreground sm:text-2xl">
                    {value}
                  </p>
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
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-8">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t submitted any reports yet.
            </p>
            <Button asChild>
              <Link to="/report">Report an incident</Link>
            </Button>
          </div>
        ) : (
          <>
            <ReportsMobileList incidents={incidents} />
            <ReportsDesktopTable incidents={incidents} />
            <p className="text-sm text-muted-foreground">
              {incidents.length} report{incidents.length === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
      <AddReportButton />
    </UserShell>
  )
}

export { ReportsPage }
