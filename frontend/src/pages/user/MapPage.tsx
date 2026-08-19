import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { AddReportButton } from "@/components/user/add-report-button"
import { UserShell } from "@/components/user/user-shell"

function MapPage() {
  return (
    <UserShell
      bleed
      title="Active incidents"
      end={
        <Link to="/search" aria-label="Search reports" className="md:hidden">
          <Search className="size-5 text-neutral-800" />
        </Link>
      }
    >
      <div className="relative min-h-0 flex-1 bg-neutral-200">
        <img
          src="/splash.png"
          alt="Incident map"
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25 ring-1 ring-white/40 md:size-64"
        />
        <span className="absolute top-[38%] left-[42%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[48%] left-[58%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[55%] left-[36%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <span className="absolute top-[32%] left-[70%] size-3 rounded-full bg-primary ring-2 ring-white" />
        <AddReportButton
          searchHref="/search"
          className="justify-end inset-x-auto right-4"
        />
      </div>
    </UserShell>
  )
}

export { MapPage }
