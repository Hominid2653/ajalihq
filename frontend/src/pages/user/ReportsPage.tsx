import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { fetchIncidents, type Incident } from "@/lib/incidents"

function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(() => setIncidents([]))
  }, [])

  return (
    <UserShell
      title="My reports"
      end={
        <Link to="/search" aria-label="Search reports">
          <Search className="size-5 text-neutral-800" />
        </Link>
      }
    >
      <div className="flex flex-col gap-2 px-4 py-4">
        {incidents.map((incident) => (
          <ReportRow key={incident.id} incident={incident} />
        ))}
        <div className="flex items-center justify-between pt-2 text-sm">
          <p className="text-neutral-500">
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
