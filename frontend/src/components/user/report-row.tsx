import { Link } from "react-router-dom"
import { format } from "date-fns"

import { reportCardClass } from "@/lib/brand"
import { isUnsetStatus, statusLabel, type Incident } from "@/lib/incidents"
import { cn } from "@/lib/utils"

function ReportRow({ incident }: { incident: Incident }) {
  const unset = isUnsetStatus(incident.status)
  const when = incident.createdAt
    ? format(new Date(incident.createdAt), "d MMM, h:mm a")
    : "—"

  return (
    <Link
      to="/coming-soon"
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3",
        reportCardClass
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-500">
          {incident.title}
        </p>
        <p className="truncate text-sm text-neutral-500">{incident.location}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm text-neutral-500">{when}</p>
        <p
          className={cn(
            "text-sm font-semibold",
            unset ? "text-red-600" : "text-neutral-700"
          )}
        >
          {statusLabel(incident.status)}
        </p>
      </div>
    </Link>
  )
}

export { ReportRow }
