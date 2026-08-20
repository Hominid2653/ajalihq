import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ChevronRight, Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  isUnsetStatus,
  statusLabel,
  typeLabel,
  type Incident,
  type IncidentStatus,
} from "@/lib/incidents"
import { cn } from "@/lib/utils"

const OPEN_STATUSES: IncidentStatus[] = ["PENDING", "VERIFIED", "IN_PROGRESS"]

const LIFECYCLE: IncidentStatus[] = [
  "PENDING",
  "VERIFIED",
  "IN_PROGRESS",
  "RESOLVED",
]

/** Prefer in-progress, then verified, then pending - newest first within tier. */
function pickActiveReport(incidents: Incident[]): Incident | null {
  const open = incidents
    .filter((i) => !i.archived && OPEN_STATUSES.includes(i.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  if (open.length === 0) return null

  const inProgress = open.find((i) => i.status === "IN_PROGRESS")
  if (inProgress) return inProgress

  const verified = open.find((i) => i.status === "VERIFIED")
  if (verified) return verified

  return open[0]
}

function statusMessage(status: IncidentStatus): string {
  switch (status) {
    case "PENDING":
      return "Waiting for review by responders"
    case "VERIFIED":
      return "Verified. Response will start soon"
    case "IN_PROGRESS":
      return "Emergency response is active"
    default:
      return statusLabel(status)
  }
}

function lifecycleIndex(status: IncidentStatus): number {
  if (status === "CLOSED") return -1
  const index = LIFECYCLE.indexOf(status)
  return index >= 0 ? index : 0
}

type ActiveReportStatusProps = {
  incidents: Incident[]
  className?: string
}

function ActiveReportStatus({ incidents, className }: ActiveReportStatusProps) {
  const active = pickActiveReport(incidents)
  if (!active) return null

  const step = lifecycleIndex(active.status)
  const unset = isUnsetStatus(active.status)

  return (
    <Link
      to={`/incidents/${active.id}`}
      className={cn(
        "block w-full max-w-md rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
        "transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            active.status === "IN_PROGRESS"
              ? "bg-[var(--status-progress)]/15 text-[var(--status-progress)]"
              : unset
                ? "bg-destructive/10 text-destructive"
                : "bg-[var(--ajali-primary)]/15 text-[var(--ajali-primary)]"
          )}
        >
          <Radio className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Active report
            </p>
            <Badge
              variant={unset ? "destructive" : "secondary"}
              className="capitalize text-[10px]"
            >
              {statusLabel(active.status)}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{active.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {active.reference} · {typeLabel(active.type)}
          </p>
          <p className="mt-2 text-xs font-medium text-foreground/80">
            {statusMessage(active.status)}
          </p>

          {/* Compact lifecycle tracker */}
          <ol className="mt-3 flex items-center gap-1" aria-label="Report progress">
            {LIFECYCLE.map((status, index) => {
              const reached = step >= index
              const current = step === index
              return (
                <li key={status} className="flex flex-1 items-center gap-1">
                  <span
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      reached
                        ? current
                          ? "bg-[var(--ajali-primary)]"
                          : "bg-[var(--ajali-primary)]/50"
                        : "bg-muted"
                    )}
                    title={statusLabel(status)}
                  />
                </li>
              )
            })}
          </ol>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              Updated{" "}
              {formatDistanceToNow(new Date(active.updatedAt), {
                addSuffix: true,
              })}
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
              Details
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export { ActiveReportStatus, pickActiveReport }
