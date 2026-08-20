import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SeverityBadge } from "@/components/incidents/severity-badge"
import { StatusBadge } from "@/components/incidents/status-badge"
import { listIncidents } from "@/api/incidents"
import type { Incident } from "@/types/incident"

export function IncidentsListPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listIncidents()
      .then(setIncidents)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load incidents")
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <Button asChild>
          <Link to="/incidents/new">Report incident</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading incidents...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : incidents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              No incidents reported yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/incidents/new">Report the first incident</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {incident.referenceNumber}
                    </p>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {incident.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={incident.status} />
                    <SeverityBadge severity={incident.severity} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}