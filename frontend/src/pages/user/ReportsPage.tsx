import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { fetchMyIncidents, type Incident } from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function ReportsPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    if (!user) return
    fetchMyIncidents(user.id)
      .then(setIncidents)
      .catch(() => setIncidents([]))
  }, [user])

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
          {incidents.map((incident) => (
            <ReportRow key={incident.id} incident={incident} />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 text-sm">
          <p className="text-muted-foreground">
            1-{incidents.length} of {incidents.length}
          </p>
          <button type="button" className="font-semibold text-primary">
            Load more
          </button>
        </div>
      </div>
      <AddReportButton />
    </UserShell>
  )
}

export { ReportsPage }
