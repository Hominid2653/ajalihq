import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { IncidentMediaPanel } from "@/components/shared/incident-media-panel"
import { UserShell } from "@/components/user/user-shell"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  fetchIncidentById,
  isCitizenEditable,
  isUnsetStatus,
  severityLabel,
  statusLabel,
  typeLabel,
  withdrawMyIncident,
  type Incident,
} from "@/lib/incidents"
import { mediaApi } from "@/services/media-api"
import { useAuth } from "@/store/hooks"
import { cn } from "@/lib/utils"
import type { IncidentMedia } from "@/types/incident"

function EvidenceGallery({ incidentId }: { incidentId: string }) {
  const [media, setMedia] = useState<IncidentMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    mediaApi
      .list(incidentId)
      .then((items) => {
        if (active) setMedia(items)
      })
      .catch(() => {
        if (active) setMedia([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [incidentId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading evidence…</p>
  }

  if (media.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No evidence photos attached.</p>
    )
  }

  return <IncidentMediaPanel media={media} readOnly />
}

function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchIncidentById(id)
      .then((record) => {
        if (!record) {
          setError("Incident not found.")
          return
        }
        if (!isAdmin && user && record.userId !== user.id) {
          setError("You do not have access to this report.")
          setIncident(null)
          return
        }
        setIncident(record)
        setError(null)
      })
      .catch(() => setError("Could not load incident."))
      .finally(() => setLoading(false))
  }, [id, user, isAdmin])

  const when = incident?.createdAt
    ? format(new Date(incident.createdAt), "d MMMM yyyy, h:mm a")
    : "-"

  const eligible =
    incident && user && incident.userId === user.id && isCitizenEditable(incident)

  async function handleWithdraw() {
    if (!incident || !user) return
    setActionPending(true)
    setError(null)
    try {
      const updated = await withdrawMyIncident(incident.id, {
        id: user.id,
        name: user.name,
      })
      setIncident(updated)
      toast.success("Report withdrawn.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw report.")
    } finally {
      setActionPending(false)
    }
  }

  return (
    <UserShell
      title="Report details"
      end={
        <Link
          to="/reports"
          aria-label="Back to reports"
          className="inline-flex items-center gap-1 text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 md:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error && !incident ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              Back to reports
            </Button>
          </div>
        ) : incident ? (
          <Card className="bg-[var(--ajali-cream)]">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {incident.reference}
                  </p>
                  <CardTitle className="text-lg">{incident.title}</CardTitle>
                </div>
                <Badge
                  variant={isUnsetStatus(incident.status) ? "destructive" : "secondary"}
                  className={cn("capitalize")}
                >
                  {statusLabel(incident.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                  {error}
                </p>
              ) : null}
              <p className="text-muted-foreground">{incident.description}</p>
              <div className="space-y-2">
                <p className="font-medium">Evidence</p>
                <EvidenceGallery incidentId={incident.id} />
              </div>
              <Separator />
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{typeLabel(incident.type)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Severity</dt>
                  <dd className="font-medium">{severityLabel(incident.severity)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-right font-medium">{incident.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reported</dt>
                  <dd className="text-right">{when}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-2">
                {eligible ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link to={`/reports/${incident.id}/edit`}>Edit</Link>
                    </Button>
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
                            The report will be closed and kept on record for audit.
                            You cannot undo this from here.
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
                  </>
                ) : !isAdmin ? (
                  <p className="text-xs text-muted-foreground">
                    This report is {statusLabel(incident.status).toLowerCase()} and
                    can no longer be edited or withdrawn.
                  </p>
                ) : null}

                {isAdmin ? (
                  <Button className="w-full font-semibold sm:w-auto" asChild>
                    <Link to={`/admin/incidents/${incident.id}`}>
                      Manage in admin
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </UserShell>
  )
}

export { IncidentDetailPage }
