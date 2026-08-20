import { Link } from "react-router-dom"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { isUnsetStatus, statusLabel, type Incident } from "@/lib/incidents"
import { cn } from "@/lib/utils"

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" | "ghost" | "link" {
  const s = (status ?? "").toLowerCase()
  if (s === "verified")                                return "secondary"
  if (s === "in_progress")                              return "outline"
  if (s === "resolved")                                return "default"
  if (s === "closed")                                  return "outline"
  return "destructive"
}

function ReportRow({
  incident,
  href,
}: {
  incident: Incident
  /** Override detail link (defaults to citizen report detail). */
  href?: string
}) {
  const unset = isUnsetStatus(incident.status)
  const when = incident.createdAt
    ? format(new Date(incident.createdAt), "d MMM, h:mm a")
    : "—"
  const to = href ?? `/reports/${incident.id}`

  return (
    <Link to={to} className="block focus-visible:outline-none">
      <Card className="cursor-pointer bg-[var(--ajali-cream)] ring-border/50 transition-shadow hover:shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-ring">
        <CardContent className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {incident.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {incident.location}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="text-xs text-muted-foreground">{when}</p>
            <Badge
              variant={statusVariant(incident.status)}
              className={cn(
                "capitalize text-[10px]",
                unset && "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {statusLabel(incident.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export { ReportRow }
