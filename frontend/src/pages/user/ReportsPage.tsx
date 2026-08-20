import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchIncidents, type Incident } from "@/lib/incidents"

/**
 * Displays the citizen's submitted incident reports.
 *
 * The page keeps track of three important states while loading reports:
 * 1. Loading - the API request is still in progress.
 * 2. Loaded - the API request completed successfully.
 * 3. Error - the API request failed.
 *
 * We start by implementing the loading state. The error state will be
 * implemented separately so each state can be tested and committed clearly.
 */
function ReportsPage() {
  // Stores the incident reports returned by the API.
  const [incidents, setIncidents] = useState<Incident[]>([])

  // Tracks whether the incident request is currently in progress.
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    /**
     * Load the user's incidents when the page first renders.
     *
     * We use an inner async function because useEffect itself should not
     * directly receive an async callback.
     */
    async function loadIncidents() {
      try {
        const data = await fetchIncidents()

        // Save the reports returned by the API.
        setIncidents(data)
      } catch {
        // Error handling will be added in the next step.
        // For now, keep the reports list empty if the request fails.
        setIncidents([])
      } finally {
        // The request has finished whether it succeeded or failed.
        setIsLoading(false)
      }
    }

    loadIncidents()
  }, [])

  return (
    <UserShell
      title="My reports"
      end={
        <Link to="/search" aria-label="Search reports">
          <Search className="size-5 text-foreground" />
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-4 md:px-8 lg:px-10">
        <div className="grid gap-2 lg:grid-cols-2">
          {isLoading ? (
            /*
             * Show skeleton cards while the API request is running.
             *
             * This prevents the page from appearing empty while data is
             * still being fetched and gives the user immediate visual
             * feedback that reports are loading.
             */
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-[var(--ajali-cream)] p-4"
              >
                <div className="space-y-3">
                  {/* Simulates the report title. */}
                  <Skeleton className="h-4 w-3/4" />

                  {/* Simulates the report location. */}
                  <Skeleton className="h-3 w-1/2" />

                  {/* Simulates the report status/date area. */}
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            incidents.map((incident) => (
              <ReportRow key={incident.id} incident={incident} />
            ))
          )}
        </div>

        {!isLoading ? (
          <div className="flex items-center justify-between pt-2 text-sm">
            <p className="text-muted-foreground">
              1-{incidents.length} of {incidents.length}
            </p>

            <button type="button" className="font-semibold text-primary">
              Load more
            </button>
          </div>
        ) : null}
      </div>

      <AddReportButton />
    </UserShell>
  )
}

export { ReportsPage }