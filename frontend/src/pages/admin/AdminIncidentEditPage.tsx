import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import { emptyIncidentForm, IncidentForm, type IncidentFormValues } from "@/components/admin/incident-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { incidentApi } from "@/services/incident-api"

function AdminIncidentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const actor = useAdminActor()
  const [values, setValues] = useState<IncidentFormValues>(emptyIncidentForm)
  const [initial, setInitial] = useState<IncidentFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const dirty = initial !== null && JSON.stringify(values) !== JSON.stringify(initial)

  useEffect(() => {
    if (!id) return
    incidentApi
      .getById(id)
      .then((record) => {
        if (!record) throw new Error("not found")
        const next: IncidentFormValues = {
          type: record.type,
          title: record.title,
          description: record.description,
          urgency: record.urgency,
          severity: record.severity,
          reporterName: record.reporterName ?? "",
          reporterEmail: record.reporterEmail ?? "",
          reporterPhone: record.reporterPhone ?? "",
          preferredContactMethod: record.preferredContactMethod ?? "PHONE",
          location: record.location,
          lat: record.lat?.toString() ?? "",
          lng: record.lng?.toString() ?? "",
          initialNote: "",
        }
        setValues(next)
        setInitial(next)
      })
      .catch(() => toast.error("Could not load incident."))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  function requestCancel() {
    if (!dirty) {
      navigate(id ? `/admin/incidents/${id}` : "/admin/incidents")
      return
    }
    setDiscardOpen(true)
  }

  function confirmDiscard() {
    setDiscardOpen(false)
    navigate(id ? `/admin/incidents/${id}` : "/admin/incidents")
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !actor) return
    setSaving(true)
    try {
      await incidentApi.update(
        id,
        {
          type: values.type,
          title: values.title.trim(),
          description: values.description.trim(),
          urgency: values.urgency,
          severity: values.severity,
          location: values.location.trim(),
          lat: values.lat === "" ? null : Number(values.lat),
          lng: values.lng === "" ? null : Number(values.lng),
          reporterName: values.reporterName.trim(),
          reporterEmail: values.reporterEmail.trim() || undefined,
          reporterPhone: values.reporterPhone.trim() || undefined,
          preferredContactMethod: values.preferredContactMethod,
        },
        actor
      )
      toast.success("Incident details updated.")
      navigate(`/admin/incidents/${id}`)
    } catch {
      toast.error("Could not update incident.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell
      title="Edit incident"
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Incidents", to: "/admin/incidents" },
        { label: "Edit" },
      ]}
    >
      <AdminPage>
        {loading ? (
          <Skeleton className="h-[600px]" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edit report metadata</CardTitle>
              <p className="text-sm text-muted-foreground">
                Status changes are only available in the moderation workspace.
              </p>
            </CardHeader>
            <CardContent>
              <IncidentForm
                values={values}
                onChange={setValues}
                onSubmit={submit}
                onCancel={requestCancel}
                saving={saving}
              />
            </CardContent>
          </Card>
        )}
      </AdminPage>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your edits will be lost if you leave this page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}

export { AdminIncidentEditPage }
