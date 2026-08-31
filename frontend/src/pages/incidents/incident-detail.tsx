import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Shield,
  User as UserIcon,
  XCircle,
} from "lucide-react"

import {
  getIncident,
  isCitizenEditable,
  withdrawIncident,
} from "@/api/incidents"
import { SeverityBadge } from "@/components/incidents/severity-badge"
import { StatusBadge } from "@/components/incidents/status-badge"
import { IncidentMediaPanel } from "@/components/shared/incident-media-panel"
import { SiteConditionsCard } from "@/components/shared/site-conditions"
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
  isResolvedStatus,
  statusLabel,
  typeLabel,
  urgencyLabel,
  type Incident,
} from "@/lib/incidents"
import { mediaApi } from "@/services/media-api"
import { useAuth } from "@/store/hooks"
import type { IncidentMedia, IncidentStatus } from "@/types/incident"

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
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground animate-pulse">
        <ImageIcon className="size-4" />
        <span>Loading evidence...</span>
      </div>
    )
  }

  return <IncidentMediaPanel media={media} readOnly />
}

function StatusTimeline({ status }: { status: IncidentStatus }) {
  const steps: { key: IncidentStatus; label: string; desc: string }[] = [
    { key: "PENDING", label: "Received", desc: "Report received" },
    { key: "VERIFIED", label: "Verified", desc: "Confirmed by admin" },
    { key: "IN_PROGRESS", label: "Responding", desc: "Units dispatched" },
    { key: "RESOLVED", label: "Resolved", desc: "Incident handled" },
  ]

  const isClosed = status === "CLOSED"

  const getStepState = (_stepKey: IncidentStatus, idx: number) => {
    if (isClosed) return "closed"
    const order: Record<IncidentStatus, number> = {
      PENDING: 0,
      VERIFIED: 1,
      IN_PROGRESS: 2,
      RESOLVED: 3,
      CLOSED: -1,
    }
    const currentOrder = order[status] ?? 0
    if (idx < currentOrder) return "completed"
    if (idx === currentOrder) return "current"
    return "upcoming"
  }

  if (isClosed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-400">
        <XCircle className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">Report Closed / Withdrawn</p>
          <p className="text-xs opacity-80">This incident report is closed and no longer active.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Progress Tracker</span>
        <span className="text-foreground">{statusLabel(status)}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key, idx)
          return (
            <div key={step.key} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  state === "completed"
                    ? "bg-emerald-600"
                    : state === "current"
                    ? "bg-primary animate-pulse"
                    : "bg-muted"
                }`}
              />
              <div className="hidden sm:block">
                <p className={`text-[11px] font-medium leading-tight ${state === "current" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
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

  const isOwner = Boolean(incident && user && incident.userId === user.id)
  const eligible = incident && isOwner ? isCitizenEditable(incident) : false
  const resolved = incident ? isResolvedStatus(incident.status) : false
  const when = incident?.createdAt
    ? format(new Date(incident.createdAt), "d MMM yyyy, h:mm a")
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
      title={isOwner ? "Incident details" : "Community report"}
      end={
        <Link
          to={isOwner ? "/incidents" : "/map"}
          aria-label={isOwner ? "Back to incidents" : "Back to map"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          <span>{isOwner ? "All incidents" : "Map"}</span>
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
            <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
          </div>
        ) : error && !incident ? (
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-center space-y-3">
              <AlertTriangle className="size-8 text-destructive mx-auto" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/incidents")}>
                Return to incidents
              </Button>
            </CardContent>
          </Card>
        ) : incident ? (
          <>
            {/* Header / Hero Overview Card */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="bg-muted/20 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {incident.reference}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {when}
                    </span>
                  </div>
                  <StatusBadge status={incident.status} />
                </div>

                <CardTitle className="text-xl font-bold tracking-tight mt-2 text-foreground">
                  {incident.title}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <SeverityBadge severity={incident.severity} />
                  <Badge variant="outline" className="text-xs capitalize font-medium">
                    {typeLabel(incident.type)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Urgency: {urgencyLabel(incident.urgency)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                {/* Visual Status Timeline */}
                <StatusTimeline status={incident.status} />

                {resolved && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>This emergency incident has been successfully resolved.</span>
                  </div>
                )}

                {/* Description Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <FileText className="size-3.5 text-primary" />
                    <span>Description</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed rounded-xl bg-muted/30 p-3.5 border border-border/40">
                    {incident.description}
                  </p>
                </div>

                {/* Location & Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <MapPin className="size-3.5 text-primary" />
                      <span>Location & Site Conditions</span>
                    </div>
                    {incident.lat != null && incident.lng != null && (
                      <Link
                        to={`/map?lat=${incident.lat}&lng=${incident.lng}`}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>View on map</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">{incident.location}</p>
                    {incident.lat != null && incident.lng != null && (
                      <p className="text-xs font-mono text-muted-foreground">
                        Coordinates: {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
                      </p>
                    )}
                  </div>

                  <SiteConditionsCard lat={incident.lat} lng={incident.lng} />
                </div>

                {/* Evidence Photos & Videos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <ImageIcon className="size-3.5 text-primary" />
                    <span>Evidence Photos & Videos</span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card p-3">
                    <EvidenceGallery incidentId={incident.id} />
                  </div>
                </div>

                {/* Reporter / Contact Information (Owner Only) */}
                {isOwner && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Shield className="size-3.5 text-primary" />
                      <span>Contact & Verification</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-2.5">
                        <UserIcon className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground">Reporter</p>
                          <p className="font-semibold text-sm truncate">{incident.reporterName || "Anonymous"}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-2.5">
                        <Phone className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground">Phone</p>
                          <p className="font-mono font-medium truncate">{incident.reporterPhone || "Not provided"}</p>
                        </div>
                      </div>

                      {incident.reporterEmail && (
                        <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-2.5 sm:col-span-2">
                          <Mail className="size-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">Email Notifications</p>
                            <p className="font-mono font-medium truncate">{incident.reporterEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {isOwner && eligible ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-initial">
                        <Link to={`/incidents/${incident.id}/edit`}>Edit Report</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={actionPending} className="flex-1 sm:flex-initial text-destructive hover:bg-destructive/10">
                            Withdraw
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Withdraw this incident?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The incident will be closed and kept on record for audit. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleWithdraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Withdraw
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : isOwner ? (
                    <p className="text-xs text-muted-foreground">
                      This incident is {statusLabel(incident.status).toLowerCase()} and cannot be modified.
                    </p>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/map">Back to map</Link>
                    </Button>
                  )}

                  {isAdmin && (
                    <Button className="w-full font-semibold sm:w-auto text-xs" size="sm" asChild>
                      <Link to={`/admin/incidents/${incident.id}/review`}>
                        Open in Admin Workspace
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </UserShell>
  )
}
