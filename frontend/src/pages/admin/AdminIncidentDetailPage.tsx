import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import {
  SeverityBadge,
  StatusBadge,
  UrgencyBadge,
  VerificationBadge,
} from "@/components/admin/status-badge"
import { IncidentMediaPanel } from "@/components/shared/incident-media-panel"
import { SiteConditionsCard } from "@/components/shared/site-conditions"
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
import { Map as IncidentMap, MapMarker, MarkerContent } from "@/components/ui/map"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { adminApi } from "@/services/admin-api"
import { departmentApi } from "@/services/department-api"
import { handoffApi } from "@/services/handoff-api"
import { incidentApi } from "@/services/incident-api"
import type {
  AuditLog,
  Department,
  DepartmentHandoff,
  Incident,
  IncidentMedia,
  IncidentNote,
  ReporterVerification,
  StatusHistory,
} from "@/types/incident"
import { handoffStatusLabel, statusLabel, typeLabel } from "@/types/incident"

function AdminIncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actor = useAdminActor()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [notes, setNotes] = useState<IncidentNote[]>([])
  const [media, setMedia] = useState<IncidentMedia[]>([])
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [verification, setVerification] = useState<ReporterVerification | null>(null)
  const [handoffs, setHandoffs] = useState<DepartmentHandoff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
  const [archiveReason, setArchiveReason] = useState("")

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [record, nextHistory, nextNotes, nextMedia, nextAudit, nextVerification, nextHandoffs, nextDepartments] =
        await Promise.all([
          incidentApi.getById(id),
          incidentApi.getHistory(id),
          incidentApi.getNotes(id),
          incidentApi.getMedia(id),
          adminApi.getAuditLogs({ incidentId: id }),
          incidentApi.getVerification(id),
          handoffApi.getByIncident(id),
          departmentApi.getAll(),
        ])
      if (!record) throw new Error("not found")
      setIncident(record)
      setHistory(nextHistory)
      setNotes(nextNotes)
      setMedia(nextMedia)
      setAudit(nextAudit)
      setVerification(nextVerification)
      setHandoffs(nextHandoffs)
      setDepartments(nextDepartments)
      setError("")
    } catch {
      setError("Could not load this incident.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const deptName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]))
    return (departmentId: string) => map.get(departmentId) ?? departmentId
  }, [departments])

  async function addNote() {
    if (!id || !actor || !note.trim()) return
    try {
      await incidentApi.addNote(id, note.trim(), actor)
      setNote("")
      toast.success("Note added.")
      await load()
    } catch {
      toast.error("Could not add note.")
    }
  }

  async function archive() {
    if (!incident || !actor || !archiveReason.trim()) return
    try {
      await incidentApi.archive(incident.id, archiveReason.trim(), actor)
      toast.success("Incident archived.")
      navigate("/admin/incidents")
    } catch {
      toast.error("Could not archive incident.")
    }
  }

  const Field = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || "-"}</dd>
    </div>
  )

  return (
    <AdminShell
      title={incident?.reference ?? "Incident details"}
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Incidents", to: "/admin/incidents" },
        { label: incident?.reference ?? "Details" },
      ]}
      end={
        incident ? (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/admin/incidents/${incident.id}/edit`}>Edit</Link>
            </Button>
            <Button asChild>
              <Link to={`/admin/incidents/${incident.id}/review`}>Review</Link>
            </Button>
          </div>
        ) : null
      }
    >
      <AdminPage wide className="space-y-5">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-44" />
            ))}
          </div>
        ) : null}
        {error ? (
          <Card>
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => navigate("/admin/incidents")}>Back to incidents</Button>
            </CardContent>
          </Card>
        ) : null}
        {!loading && incident ? (
          <>
            <Card className="bg-[var(--ajali-cream)]">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{incident.reference}</p>
                    <CardTitle>{incident.title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <UrgencyBadge urgency={incident.urgency} />
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{incident.description}</p>
                <Separator />
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Type" value={typeLabel(incident.type)} />
                  <Field label="Created" value={format(new Date(incident.createdAt), "d MMM yyyy, h:mm a")} />
                  <Field label="Last updated" value={format(new Date(incident.updatedAt), "d MMM yyyy, h:mm a")} />
                  <Field label="Archived" value={incident.archived ? `Yes - ${incident.archiveReason}` : "No"} />
                </dl>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Reporter</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" value={incident.reporterName} />
                    <Field label="User ID" value={incident.userId} />
                    <Field label="Email" value={incident.reporterEmail} />
                    <Field label="Phone" value={incident.reporterPhone} />
                    <Field label="Preferred contact" value={incident.preferredContactMethod} />
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Address" value={incident.location} />
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Latitude"
                      value={incident.lat !== null ? String(incident.lat) : undefined}
                    />
                    <Field
                      label="Longitude"
                      value={incident.lng !== null ? String(incident.lng) : undefined}
                    />
                  </dl>
                  {incident.lat !== null && incident.lng !== null ? (
                    <div className="h-56 overflow-hidden rounded-lg">
                      <IncidentMap center={[incident.lng, incident.lat]} zoom={13} theme="light">
                        <MapMarker longitude={incident.lng} latitude={incident.lat}>
                          <MarkerContent>
                            <span className="block size-4 rounded-full border-2 border-white bg-[var(--ajali-primary)] shadow" />
                          </MarkerContent>
                        </MapMarker>
                      </IncidentMap>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                      Coordinates were not supplied.
                    </p>
                  )}
                  <SiteConditionsCard lat={incident.lat} lng={incident.lng} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerificationBadge status={verification?.status ?? "PENDING"} />
                    {verification?.method ? (
                      <span className="text-sm text-muted-foreground">via {verification.method}</span>
                    ) : null}
                  </div>
                  {verification?.notes ? (
                    <p className="text-sm">{verification.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No verification notes yet.</p>
                  )}
                  {verification?.verifiedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {verification.verifiedByName
                        ? `${verification.verifiedByName} · `
                        : ""}
                      {format(new Date(verification.verifiedAt), "d MMM yyyy, h:mm a")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department handoffs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {handoffs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments assigned yet.</p>
                  ) : (
                    handoffs.map((handoff) => (
                      <div key={handoff.id} className="rounded-lg border p-3">
                        <p className="font-medium">{deptName(handoff.departmentId)}</p>
                        <p className="text-xs text-muted-foreground">
                          {handoffStatusLabel(handoff.status)} · {handoff.initiatedByName}
                        </p>
                        {handoff.notes ? <p className="mt-1 text-xs">{handoff.notes}</p> : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncidentMediaPanel
                    incidentId={incident.id}
                    media={media}
                    actor={actor}
                    onChanged={() => void load()}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary pl-3">
                      <p className="text-sm font-semibold">{statusLabel(item.toStatus)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.actorName} · {format(new Date(item.createdAt), "d MMM, h:mm a")}
                      </p>
                      {item.reason ? <p className="text-xs">{item.reason}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notes.map((item) => (
                    <div key={item.id} className="rounded-lg bg-[var(--ajali-cream)] p-3">
                      <p className="text-sm">{item.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.authorName} · {format(new Date(item.createdAt), "d MMM, h:mm a")}
                      </p>
                    </div>
                  ))}
                  <Textarea
                    placeholder="Add an operational note…"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <Button disabled={!actor || !note.trim()} onClick={() => void addNote()}>
                    Add note
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {audit.slice(0, 6).map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.actorName} · {format(new Date(item.createdAt), "d MMM, h:mm a")}
                      </p>
                    </div>
                  ))}
                  {audit.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No audit activity.</p>
                  ) : null}
                  <Button variant="link" asChild className="px-0">
                    <Link to="/admin/audit-log">View audit log</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base">Archive incident</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Archive</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive {incident.reference}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The incident remains in audit history but leaves active admin views. Give a reason.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      value={archiveReason}
                      onChange={(event) => setArchiveReason(event.target.value)}
                      placeholder="Archive reason"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={!archiveReason.trim()}
                        onClick={() => void archive()}
                      >
                        Archive incident
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </>
        ) : null}
      </AdminPage>
    </AdminShell>
  )
}

export { AdminIncidentDetailPage }
