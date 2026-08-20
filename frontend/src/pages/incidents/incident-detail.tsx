import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SeverityBadge } from "@/components/incidents/severity-badge"
import { StatusBadge } from "@/components/incidents/status-badge"
import { deleteIncident, getIncident, withdrawIncident } from "@/api/incidents"
import {
  INCIDENT_TYPE_LABELS,
  isEligibleForWithdrawOrDelete,
  type Incident,
} from "@/types/incident"

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIncident(id)
      .then(setIncident)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load incident")
      )
      .finally(() => setLoading(false))
  }, [id])

  async function handleWithdraw() {
    if (!incident) return
    setActionPending(true)
    try {
      const updated = await withdrawIncident(incident.id)
      setIncident(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw incident")
    } finally {
      setActionPending(false)
    }
  }

  async function handleDelete() {
    if (!incident) return
    setActionPending(true)
    try {
      await deleteIncident(incident.id)
      navigate("/incidents")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete incident")
      setActionPending(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading incident...</p>
      </main>
    )
  }

  if (error && !incident) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate("/incidents")}>
          Back to incidents
        </Button>
      </main>
    )
  }

  if (!incident) return null

  const eligible = isEligibleForWithdrawOrDelete(incident)

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardDescription>{incident.referenceNumber}</CardDescription>
            <StatusBadge status={incident.status} />
          </div>
          <CardTitle className="text-2xl">{incident.title}</CardTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <SeverityBadge severity={incident.severity} />
            <span className="text-sm text-muted-foreground">
              {INCIDENT_TYPE_LABELS[incident.incidentType]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div>
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted-foreground">{incident.location}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {eligible && (
              <Button asChild variant="outline">
                <Link to={`/incidents/${incident.id}/edit`}>Edit</Link>
              </Button>
            )}

            {eligible && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={actionPending}>
                    Withdraw
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw this report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The incident will be marked as withdrawn but kept on
                      record. This can't be undone from here.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWithdraw}>
                      Withdraw
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {eligible && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={actionPending}>
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the incident. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!eligible && (
              <p className="text-sm text-muted-foreground">
                This incident is {incident.status} and can no longer be
                edited, withdrawn, or deleted.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button variant="ghost" asChild className="self-start">
        <Link to="/incidents">← Back to all incidents</Link>
      </Button>
    </main>
  )
}