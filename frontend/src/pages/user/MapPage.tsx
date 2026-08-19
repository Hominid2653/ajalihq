import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { UserShell } from "@/components/user/user-shell"

function MapPage() {
  return (
    <UserShell
      title="My reports"
      end={
        <Link to="/search" aria-label="Search reports">
          <Search className="size-5 text-neutral-800" />
        </Link>
      }
    >
      <div className="relative min-h-[calc(100svh-3.5rem-5rem)] bg-neutral-200">
        <img src="/splash.png" alt="Incident map" className="size-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25 ring-1 ring-white/40"
        />
        <span className="absolute top-[38%] left-[42%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[48%] left-[58%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[55%] left-[36%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <AddReportButton />
      </div>
    </UserShell>
  )
}

export { MapPage }
