import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, ArrowRight, MapPin } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  fetchActiveIncidents,
  statusLabel,
  type Incident,
} from "@/lib/incidents"

const MAX_VISIBLE = 3

function IncidentAwareness() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchActiveIncidents()
      .then((active) => {
        if (!cancelled) setIncidents(active)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const visible = incidents.slice(0, MAX_VISIBLE)

  return (
    <Card className="w-full max-w-md text-left">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-primary" aria-hidden />
          Active incidents
        </CardTitle>
        <Badge variant="secondary" className="tabular-nums">
          {loading ? "…" : incidents.length}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {loading && (
          <p className="text-sm text-muted-foreground">
            Checking for active incidents…
          </p>
        )}

        {!loading && incidents.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active incidents reported right now.
          </p>
        )}

        {!loading &&
          visible.map((incident) => (
            <div
              key={incident.id}
              className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {incident.title}
                </p>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {statusLabel(incident.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden />
                  {incident.location}
                </span>
                <span>
                  {formatDistanceToNow(new Date(incident.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}

        {!loading && incidents.length > 0 && (
          <Link
            to="/signin"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all active incidents
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

export { IncidentAwareness }