import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import {
  getIncident,
  isCitizenEditable,
  withdrawIncident,
} from "@/api/incidents"
import { SeverityBadge } from "@/components/incidents/severity-badge"
import { StatusBadge } from "@/components/incidents/status-badge"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { statusLabel, typeLabel, urgencyLabel, type Incident } from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIncident(id)
      .then((record) => {
        setIncident(record)
        setError(null)
      })
      .catch((err: unknown) => {
        setIncident(null)
        setError(err instanceof Error ? err.message : "Failed to load incident")
      })
      .finally(() => setLoading(false))
  }, [id])

  const eligible = incident ? isCitizenEditable(incident) : false
  const when = incident?.createdAt
    ? format(new Date(incident.createdAt), "d MMMM yyyy, h:mm a")
    : "-"

  async function handleWithdraw() {
    if (!incident) return
    setActionPending(true)
    setError(null)
    try {
      const updated = await withdrawIncident(incident.id)
      setIncident(updated)
      toast.success("Incident withdrawn.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw incident")
    } finally {
      setActionPending(false)
    }
  }

  return (
    <UserShell
      title="Incident details"
      end={
        <Link
          to="/incidents"
          aria-label="Back to incidents"
          className="inline-flex items-center gap-1 text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 md:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading incident…</p>
        ) : error && !incident ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate("/incidents")}>
              Back to incidents
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
                <StatusBadge status={incident.status} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <SeverityBadge severity={incident.severity} />
                <span className="text-sm text-muted-foreground">
                  {typeLabel(incident.type)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Urgency: {urgencyLabel(incident.urgency)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                  {error}
                </p>
              ) : null}

              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{incident.location}</p>
              </div>
              <div>
                <p className="font-medium">Description</p>
                <p className="text-muted-foreground">{incident.description}</p>
              </div>
              <Separator />
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reporter</dt>
                  <dd className="text-right font-medium">
                    {incident.reporterName || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="text-right font-medium">
                    {incident.reporterPhone || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right font-medium">
                    {incident.reporterEmail || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Preferred contact</dt>
                  <dd className="text-right font-medium">
                    {incident.preferredContactMethod || "-"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">Reported {when}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {eligible ? (
                  <>
                    <Button asChild variant="outline">
                      <Link to={`/incidents/${incident.id}/edit`}>Edit</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={actionPending}>
                          Withdraw
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Withdraw this incident?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The incident will be closed and kept on record for audit.
                            This can&apos;t be undone from here.
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
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This incident is {statusLabel(incident.status).toLowerCase()} and
                    can no longer be edited or withdrawn.
                  </p>
                )}

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
