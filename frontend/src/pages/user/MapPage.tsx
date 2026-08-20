import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { UserShell } from "@/components/user/user-shell"
import { Badge } from "@/components/ui/badge"
import { fetchIncidents } from "@/lib/incidents"

function MapPage() {
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    fetchIncidents()
      .then((incidents) => {
        // Active = anything not resolved / closed
        const count = incidents.filter((i) => {
          const s = (i.status ?? "").toLowerCase()
          return s !== "resolved" && s !== "closed"
        }).length
        setActiveCount(count)
      })
      .catch(() => setActiveCount(0))
  }, [])

  return (
    <UserShell
      bleed
      title={
        <>
          <span className="size-2 shrink-0 rounded-full bg-[var(--ajali-primary)]" aria-hidden />
          <span className="truncate">Active incidents</span>
          <Badge
            variant="default"
            className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
          >
            {activeCount}
          </Badge>
        </>
      }
      end={
        <Link to="/search" aria-label="Search reports" className="md:hidden">
          <Search className="size-5 text-foreground" />
        </Link>
      }
    >
      <div className="relative min-h-0 flex-1 bg-muted">
        <img
          src="/splash.png"
          alt="Incident map"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25 ring-1 ring-white/40 sm:size-56 md:size-64"
        />
        <span className="absolute top-[38%] left-[42%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[48%] left-[58%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[55%] left-[36%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[32%] left-[70%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <AddReportButton
          searchHref="/search"
          className="inset-x-auto right-4 justify-end"
        />
      </div>
    </UserShell>
  )
}

export { MapPage }
