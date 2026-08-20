import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { Copy, Phone } from "lucide-react"
import { toast } from "sonner"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import {
  SeverityBadge,
  StatusBadge,
  UrgencyBadge,
  VerificationBadge,
} from "@/components/admin/status-badge"
import { IncidentMediaPanel } from "@/components/shared/incident-media-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Map as IncidentMap, MapMarker, MarkerContent } from "@/components/ui/map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { departmentApi } from "@/services/department-api"
import { handoffApi } from "@/services/handoff-api"
import { incidentApi } from "@/services/incident-api"
import type {
  CloseReasonCode,
  Department,
  DepartmentHandoff,
  Incident,
  IncidentMedia,
  IncidentNote,
  IncidentSeverity,
  IncidentUrgency,
  ReporterVerification,
  ResolutionOutcome,
  StatusHistory,
  VerificationMethod,
} from "@/types/incident"
import {
  closeReasonLabel,
  handoffStatusLabel,
  resolutionOutcomeLabel,
  statusLabel,
  typeLabel,
} from "@/types/incident"

function AdminIncidentReviewPage() {
  const { id } = useParams<{ id: string }>()
  const actor = useAdminActor()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [notes, setNotes] = useState<IncidentNote[]>([])
  const [media, setMedia] = useState<IncidentMedia[]>([])
  const [verification, setVerification] = useState<ReporterVerification | null>(null)
  const [handoffs, setHandoffs] = useState<DepartmentHandoff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [note, setNote] = useState("")

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyMethod, setVerifyMethod] = useState<VerificationMethod>("PHONE")
  const [verifyNotes, setVerifyNotes] = useState("")

  const [closeOpen, setCloseOpen] = useState(false)
  const [closeReason, setCloseReason] = useState("")
  const [closeCode, setCloseCode] = useState<CloseReasonCode>("FALSE_REPORT")

  const [startOpen, setStartOpen] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [startNotes, setStartNotes] = useState("")

  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveSummary, setResolveSummary] = useState("")
  const [resolveNotes, setResolveNotes] = useState("")
  const [resolveOutcome, setResolveOutcome] = useState<ResolutionOutcome>("RESOLVED")
  const [notifySms, setNotifySms] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(false)
  const [notifySkip, setNotifySkip] = useState(false)

  const [reopenReason, setReopenReason] = useState("")
  const [reopenOpen, setReopenOpen] = useState(false)

  const [triageOpen, setTriageOpen] = useState(false)
  const [editUrgency, setEditUrgency] = useState<IncidentUrgency>("MEDIUM")
  const [editSeverity, setEditSeverity] = useState<IncidentSeverity>("MODERATE")

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [record, nextHistory, nextNotes, nextMedia, nextVerification, nextHandoffs, nextDepartments] =
        await Promise.all([
          incidentApi.getById(id),
          incidentApi.getHistory(id),
          incidentApi.getNotes(id),
          incidentApi.getMedia(id),
          incidentApi.getVerification(id),
          handoffApi.getByIncident(id),
          departmentApi.getAll({ activeOnly: true }),
        ])
      if (!record) throw new Error("not found")
      setIncident(record)
      setHistory(nextHistory)
      setNotes(nextNotes)
      setMedia(nextMedia)
      setVerification(nextVerification)
      setHandoffs(nextHandoffs)
      setDepartments(nextDepartments)
      setError("")
    } catch {
      setError("Could not load the moderation workspace.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const deptName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]))
    // Include inactive for display of existing handoffs
    return (departmentId: string) => map.get(departmentId) ?? departmentId
  }, [departments])

  useEffect(() => {
    void departmentApi.getAll().then((all) => {
      setDepartments((active) => {
        const byId = new Map(all.map((d) => [d.id, d]))
        active.forEach((d) => byId.set(d.id, d))
        return [...byId.values()]
      })
    })
  }, [])

  async function copyPhone() {
    if (!incident?.reporterPhone) return
    try {
      await navigator.clipboard.writeText(incident.reporterPhone)
      toast.success("Phone number copied.")
    } catch {
      toast.error("Could not copy phone number.")
    }
  }

  async function submitVerify() {
    if (!incident || !actor) return
    setBusy(true)
    try {
      await incidentApi.verify(incident.id, { method: verifyMethod, notes: verifyNotes }, actor)
      toast.success("Report verified.")
      setVerifyOpen(false)
      setVerifyNotes("")
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not verify.")
    } finally {
      setBusy(false)
    }
  }

  async function submitClose() {
    if (!incident || !actor || !closeReason.trim()) return
    setBusy(true)
    try {
      await incidentApi.close(
        incident.id,
        {
          reason: closeReason.trim(),
          reasonCode: closeCode,
          failVerification: incident.status === "PENDING",
        },
        actor
      )
      toast.success("Report closed.")
      setCloseOpen(false)
      setCloseReason("")
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not close.")
    } finally {
      setBusy(false)
    }
  }

  async function submitStart() {
    if (!incident || !actor) return
    setBusy(true)
    try {
      await incidentApi.startResponse(
        incident.id,
        { departmentIds: selectedDepts, notes: startNotes },
        actor
      )
      toast.success("Response started.")
      setStartOpen(false)
      setSelectedDepts([])
      setStartNotes("")
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not start response.")
    } finally {
      setBusy(false)
    }
  }

  function openResolveDialog() {
    if (!incident) return
    const preferPhone =
      incident.preferredContactMethod === "PHONE" || !incident.preferredContactMethod
    const preferEmail = incident.preferredContactMethod === "EMAIL"
    setNotifySms(Boolean(incident.reporterPhone) && (preferPhone || !incident.reporterEmail))
    setNotifyEmail(Boolean(incident.reporterEmail) && (preferEmail || !incident.reporterPhone))
    setNotifySkip(false)
    setResolveOpen(true)
  }

  async function submitResolve() {
    if (!incident || !actor || !resolveSummary.trim()) return
    if (!notifySkip && !notifySms && !notifyEmail) {
      toast.error("Choose SMS and/or email to notify the citizen, or skip notification.")
      return
    }
    if (!notifySkip && notifySms && !incident.reporterPhone) {
      toast.error("Cannot send SMS — no reporter phone on file.")
      return
    }
    if (!notifySkip && notifyEmail && !incident.reporterEmail) {
      toast.error("Cannot send email — no reporter email on file.")
      return
    }
    setBusy(true)
    try {
      await incidentApi.resolve(
        incident.id,
        {
          summary: resolveSummary.trim(),
          notes: resolveNotes,
          outcome: resolveOutcome,
          completeHandoffs: true,
          notifyCitizen: notifySkip
            ? { sms: false, email: false }
            : { sms: notifySms, email: notifyEmail },
        },
        actor
      )
      if (notifySkip) {
        toast.success("Incident resolved. Citizen was not notified.")
      } else {
        const channels = [
          ...(notifySms ? ["SMS"] : []),
          ...(notifyEmail ? ["email"] : []),
        ].join(" + ")
        toast.success(`Incident resolved. Citizen notify queued via ${channels}.`)
      }
      setResolveOpen(false)
      setResolveSummary("")
      setResolveNotes("")
      setNotifySms(false)
      setNotifyEmail(false)
      setNotifySkip(false)
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not resolve.")
    } finally {
      setBusy(false)
    }
  }

  async function submitReopen() {
    if (!incident || !actor || !reopenReason.trim()) return
    setBusy(true)
    try {
      await incidentApi.reopen(incident.id, reopenReason.trim(), actor)
      toast.success("Incident reopened.")
      setReopenOpen(false)
      setReopenReason("")
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not reopen.")
    } finally {
      setBusy(false)
    }
  }

  async function addNote() {
    if (!incident || !actor || !note.trim()) return
    try {
      await incidentApi.addNote(incident.id, note.trim(), actor)
      setNote("")
      toast.success("Note added.")
      await load()
    } catch {
      toast.error("Could not add note.")
    }
  }

  async function updateHandoffStatus(handoffId: string, status: DepartmentHandoff["status"]) {
    if (!actor) return
    try {
      await handoffApi.update(handoffId, { status }, actor)
      toast.success(status === "CANCELLED" ? "Handoff cancelled." : "Handoff updated.")
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update handoff.")
    }
  }

  function openTriageDialog() {
    if (!incident) return
    setEditUrgency(incident.urgency)
    setEditSeverity(incident.severity)
    setTriageOpen(true)
  }

  async function submitTriage() {
    if (!incident || !actor) return
    setBusy(true)
    try {
      if (editUrgency !== incident.urgency) {
        await incidentApi.updateUrgency(incident.id, editUrgency, actor)
      }
      if (editSeverity !== incident.severity) {
        await incidentApi.updateSeverity(incident.id, editSeverity, actor)
      }
      toast.success("Urgency and severity updated.")
      setTriageOpen(false)
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update triage.")
    } finally {
      setBusy(false)
    }
  }

  const canAddNote =
    incident?.status === "PENDING" ||
    incident?.status === "VERIFIED" ||
    incident?.status === "IN_PROGRESS"

  const canEditTriage =
    incident?.status === "VERIFIED" || incident?.status === "IN_PROGRESS"

  const primaryAction =
    incident?.status === "PENDING"
      ? { label: "Verify report", onClick: () => setVerifyOpen(true) }
      : incident?.status === "VERIFIED"
        ? { label: "Start response", onClick: () => setStartOpen(true) }
        : incident?.status === "IN_PROGRESS"
          ? { label: "Resolve incident", onClick: () => openResolveDialog() }
          : incident?.status === "RESOLVED"
            ? { label: "View resolution", onClick: () => document.getElementById("resolution")?.scrollIntoView({ behavior: "smooth" }) }
            : null

  return (
    <AdminShell
      title="Review incident"
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Incidents", to: "/admin/incidents" },
        { label: incident?.reference ?? "Review", to: incident ? `/admin/incidents/${incident.id}` : undefined },
        { label: "Review" },
      ]}
    >
      <AdminPage wide className="space-y-5">
        {loading ? <Skeleton className="h-80" /> : null}
        {error ? <p className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p> : null}

        {incident ? (
          <>
            <Card className="border-primary/20 bg-[var(--ajali-cream)]">
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-semibold tracking-wide">{incident.reference}</p>
                  <h2 className="text-xl font-bold">{incident.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={incident.status} />
                    <UrgencyBadge urgency={incident.urgency} />
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Received {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {primaryAction ? (
                  <Button size="lg" className="shrink-0" onClick={primaryAction.onClick}>
                    {primaryAction.label}
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="space-y-5">
                <Card>
                  <CardHeader><CardTitle>Incident summary</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p>{incident.description}</p>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{typeLabel(incident.type)}</dd></div>
                      <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{incident.location}</dd></div>
                      <div><dt className="text-muted-foreground">Latitude</dt><dd className="font-medium">{incident.lat ?? "—"}</dd></div>
                      <div><dt className="text-muted-foreground">Longitude</dt><dd className="font-medium">{incident.lng ?? "—"}</dd></div>
                    </dl>
                    {incident.lat !== null && incident.lng !== null ? (
                      <div className="h-44 overflow-hidden rounded-lg">
                        <IncidentMap center={[incident.lng, incident.lat]} zoom={13} theme="light">
                          <MapMarker longitude={incident.lng} latitude={incident.lat}>
                            <MarkerContent>
                              <span className="block size-4 rounded-full border-2 border-white bg-[var(--ajali-primary)] shadow" />
                            </MarkerContent>
                          </MapMarker>
                        </IncidentMap>
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                        No coordinates on this report.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reporter verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-muted/60 p-4">
                      <p className="text-lg font-semibold">{incident.reporterName || "Anonymous"}</p>
                      <p className="text-sm">{incident.reporterPhone || "No phone on file"}</p>
                      <p className="text-sm text-muted-foreground">{incident.reporterEmail || "No email on file"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Preferred: {incident.preferredContactMethod ?? "PHONE"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Verification status:</span>
                      <VerificationBadge status={verification?.status ?? "PENDING"} />
                    </div>
                    {verification?.notes ? (
                      <p className="text-sm"><span className="font-medium">Notes:</span> {verification.notes}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {incident.reporterPhone ? (
                        <>
                          <Button asChild variant="outline">
                            <a href={`tel:${incident.reporterPhone}`}>
                              <Phone className="mr-2 size-4" />
                              Call reporter
                            </a>
                          </Button>
                          <Button variant="outline" onClick={() => void copyPhone()}>
                            <Copy className="mr-2 size-4" />
                            Copy number
                          </Button>
                        </>
                      ) : null}
                      {incident.status === "PENDING" ? (
                        <>
                          <Button onClick={() => setVerifyOpen(true)}>Mark as verified</Button>
                          <Button variant="destructive" onClick={() => setCloseOpen(true)}>
                            Close as false/invalid
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
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
                  <CardHeader><CardTitle>Department handoff</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {handoffs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No departments assigned yet.</p>
                    ) : (
                      handoffs.map((handoff) => (
                        <div key={handoff.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">{deptName(handoff.departmentId)}</p>
                            <p className="text-xs text-muted-foreground">
                              {handoffStatusLabel(handoff.status)} · {handoff.initiatedByName}
                            </p>
                            {handoff.notes ? <p className="text-xs">{handoff.notes}</p> : null}
                          </div>
                          {incident.status === "IN_PROGRESS" && handoff.status !== "COMPLETED" && handoff.status !== "CANCELLED" ? (
                            <div className="flex flex-wrap gap-2">
                              {handoff.status === "PENDING" ? (
                                <Button size="sm" variant="outline" onClick={() => void updateHandoffStatus(handoff.id, "ACKNOWLEDGED")}>
                                  Acknowledge
                                </Button>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => void updateHandoffStatus(handoff.id, "IN_PROGRESS")}>
                                In progress
                              </Button>
                              <Button size="sm" onClick={() => void updateHandoffStatus(handoff.id, "COMPLETED")}>
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => void updateHandoffStatus(handoff.id, "CANCELLED")}
                              >
                                Cancel handoff
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {incident.status === "RESOLVED" ? (
                  <Card id="resolution">
                    <CardHeader><CardTitle>Resolution</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Outcome:</span> {incident.resolutionOutcome ? resolutionOutcomeLabel(incident.resolutionOutcome) : "—"}</p>
                      <p><span className="text-muted-foreground">Summary:</span> {incident.resolutionSummary}</p>
                      {incident.resolutionNotes ? <p><span className="text-muted-foreground">Notes:</span> {incident.resolutionNotes}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        Resolved by {incident.resolvedByName}
                        {incident.resolvedAt ? ` · ${incident.resolvedAt}` : ""}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-5">
                <Card>
                  <CardHeader><CardTitle>Primary actions</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {incident.status === "PENDING" ? (
                      <>
                        <Button onClick={() => setVerifyOpen(true)}>Verify report</Button>
                        <Button variant="destructive" onClick={() => setCloseOpen(true)}>Close as invalid</Button>
                        <Button variant="outline" asChild><Link to={`/admin/incidents/${incident.id}/edit`}>Edit details</Link></Button>
                      </>
                    ) : null}
                    {incident.status === "VERIFIED" ? (
                      <>
                        <Button onClick={() => setStartOpen(true)}>Start response</Button>
                        <Button variant="destructive" onClick={() => setCloseOpen(true)}>Close</Button>
                        <Button variant="outline" onClick={openTriageDialog}>Update urgency / severity</Button>
                        <Button variant="outline" asChild><Link to={`/admin/incidents/${incident.id}/edit`}>Edit details</Link></Button>
                      </>
                    ) : null}
                    {incident.status === "IN_PROGRESS" ? (
                      <>
                        <Button onClick={() => openResolveDialog()}>Resolve incident</Button>
                        <Button variant="outline" onClick={openTriageDialog}>Update urgency / severity</Button>
                      </>
                    ) : null}
                    {canAddNote ? (
                      <div className="space-y-2 pt-2">
                        <Textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Add operational note"
                        />
                        <Button variant="outline" disabled={!note.trim() || !actor} onClick={() => void addNote()}>
                          Add note
                        </Button>
                      </div>
                    ) : null}
                    {incident.status === "RESOLVED" || incident.status === "CLOSED" ? (
                      <>
                        <Button variant="outline" onClick={() => setReopenOpen(true)}>Reopen incident</Button>
                        <Button variant="outline" asChild><Link to={`/admin/incidents/${incident.id}`}>View full detail</Link></Button>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Status history</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="border-l-2 border-primary pl-3">
                        <p className="text-sm font-semibold">{statusLabel(item.toStatus)}</p>
                        <p className="text-xs text-muted-foreground">{item.actorName}</p>
                        {item.reason ? <p className="text-xs">{item.reason}</p> : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {notes.length ? (
                  <Card>
                    <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {notes.map((item) => (
                        <div key={item.id} className="rounded-lg bg-muted p-3 text-sm">
                          <p>{item.body}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.authorName}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </AdminPage>

      {/* Verify dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm you contacted/reviewed the reporter and the incident is legitimate.
            </p>
            <div className="space-y-2">
              <Label>Verification method</Label>
              <Select value={verifyMethod} onValueChange={(value) => setVerifyMethod(value as VerificationMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification notes</Label>
              <Textarea value={verifyNotes} onChange={(event) => setVerifyNotes(event.target.value)} placeholder="Reporter confirmed accident at location." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button disabled={busy || !actor} onClick={() => void submitVerify()}>
              {busy ? "Saving…" : "Mark as verified"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close dialog */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close as false/invalid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason code</Label>
              <Select value={closeCode} onValueChange={(value) => setCloseCode(value as CloseReasonCode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["FALSE_REPORT", "DUPLICATE", "UNABLE_TO_VERIFY", "INSUFFICIENT_INFORMATION", "OTHER"] as CloseReasonCode[]).map((code) => (
                    <SelectItem key={code} value={code}>{closeReasonLabel(code)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea value={closeReason} onChange={(event) => setCloseReason(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy || !closeReason.trim()} onClick={() => void submitClose()}>
              Close report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start response */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start response</DialogTitle>
          </DialogHeader>
          {incident ? (
            <div className="space-y-4">
              <p className="text-sm"><span className="font-mono font-semibold">{incident.reference}</span> · {incident.urgency} urgency</p>
              <div className="space-y-2">
                <Label>Select department(s)</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {departments.filter((d) => d.active).map((department) => {
                    const checked = selectedDepts.includes(department.id)
                    return (
                      <label key={department.id} className="flex items-center gap-3 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            setSelectedDepts((prev) =>
                              value
                                ? [...prev, department.id]
                                : prev.filter((entry) => entry !== department.id)
                            )
                          }}
                        />
                        {department.name}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Response notes</Label>
                <Textarea value={startNotes} onChange={(event) => setStartNotes(event.target.value)} />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>Cancel</Button>
            <Button disabled={busy || selectedDepts.length === 0} onClick={() => void submitStart()}>
              Start response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve incident</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {handoffs.length ? (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="mb-1 font-medium">Departments involved</p>
                <ul className="list-disc pl-4">
                  {handoffs.map((h) => <li key={h.id}>{deptName(h.departmentId)}</li>)}
                </ul>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={resolveOutcome} onValueChange={(value) => setResolveOutcome(value as ResolutionOutcome)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["RESOLVED", "ASSISTANCE_PROVIDED", "REFERRED", "UNABLE_TO_ASSIST", "OTHER"] as ResolutionOutcome[]).map((value) => (
                    <SelectItem key={value} value={value}>{resolutionOutcomeLabel(value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution summary (required)</Label>
              <Textarea value={resolveSummary} onChange={(event) => setResolveSummary(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Additional notes</Label>
              <Textarea value={resolveNotes} onChange={(event) => setResolveNotes(event.target.value)} />
            </div>

            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm font-semibold">Notify citizen of resolution</p>
                <p className="text-xs text-muted-foreground">
                  Status moves from handoff / in progress to resolved. Choose how to notify the reporter (mocked SMS/email for Sprint 1).
                </p>
              </div>
              {incident ? (
                <p className="text-xs text-muted-foreground">
                  Contact on file: {incident.reporterPhone || "no phone"} · {incident.reporterEmail || "no email"}
                  {incident.preferredContactMethod ? ` · prefers ${incident.preferredContactMethod}` : ""}
                </p>
              ) : null}
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={notifySms}
                  disabled={notifySkip || !incident?.reporterPhone}
                  onCheckedChange={(value) => setNotifySms(Boolean(value))}
                />
                <span>
                  SMS
                  <span className="block text-xs text-muted-foreground">
                    {incident?.reporterPhone || "No phone on file"}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={notifyEmail}
                  disabled={notifySkip || !incident?.reporterEmail}
                  onCheckedChange={(value) => setNotifyEmail(Boolean(value))}
                />
                <span>
                  Email
                  <span className="block text-xs text-muted-foreground">
                    {incident?.reporterEmail || "No email on file"}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={notifySkip}
                  onCheckedChange={(value) => {
                    const skip = Boolean(value)
                    setNotifySkip(skip)
                    if (skip) {
                      setNotifySms(false)
                      setNotifyEmail(false)
                    }
                  }}
                />
                <span>Do not notify the citizen</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button disabled={busy || !resolveSummary.trim()} onClick={() => void submitResolve()}>
              Mark as resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reopen incident</DialogTitle></DialogHeader>
          <Textarea value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Reason (required)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button disabled={busy || !reopenReason.trim()} onClick={() => void submitReopen()}>Reopen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update urgency &amp; severity</DialogTitle>
          </DialogHeader>
          {canEditTriage ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select
                  value={editUrgency}
                  onValueChange={(value) => setEditUrgency(value as IncidentUrgency)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as IncidentUrgency[]).map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={editSeverity}
                  onValueChange={(value) => setEditSeverity(value as IncidentSeverity)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["MINOR", "MODERATE", "MAJOR", "CRITICAL"] as IncidentSeverity[]).map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriageOpen(false)}>Cancel</Button>
            <Button disabled={busy || !actor} onClick={() => void submitTriage()}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

export { AdminIncidentReviewPage }
