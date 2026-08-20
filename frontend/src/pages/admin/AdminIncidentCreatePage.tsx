import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import { emptyIncidentForm, IncidentForm, type IncidentFormValues } from "@/components/admin/incident-form"
import { IncidentMediaPanel, type PendingMedia } from "@/components/shared/incident-media-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { incidentApi } from "@/services/incident-api"
import { toDurableMediaUrl } from "@/services/media-api"
import { typeLabel } from "@/types/incident"

async function durableDraftMedia(items: PendingMedia[]) {
  return Promise.all(
    items.map(async (item) => {
      if (item.file) {
        const url = await toDurableMediaUrl(item.file)
        return { kind: item.kind, url, name: item.name }
      }
      const url = item.url.startsWith("blob:")
        ? item.kind === "video"
          ? "/icons.svg"
          : "/splash.png"
        : item.url
      return { kind: item.kind, url, name: item.name }
    })
  )
}

function AdminIncidentCreatePage() {
  const navigate = useNavigate()
  const actor = useAdminActor()
  const [values, setValues] = useState<IncidentFormValues>(emptyIncidentForm)
  const [draftMedia, setDraftMedia] = useState<PendingMedia[]>([])
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) return toast.error("Your admin session is unavailable.")
    setSaving(true)
    try {
      const title =
        values.title.trim() ||
        `${typeLabel(values.type)} — ${values.location.trim() || "Reported incident"}`
      const media = await durableDraftMedia(draftMedia)
      const created = await incidentApi.create(
        {
          type: values.type,
          title,
          description: values.description.trim(),
          urgency: values.urgency,
          severity: values.severity,
          location: values.location.trim(),
          lat: values.lat === "" ? null : Number(values.lat),
          lng: values.lng === "" ? null : Number(values.lng),
          userId: actor.id,
          reporterName: values.reporterName.trim(),
          reporterEmail: values.reporterEmail.trim() || undefined,
          reporterPhone: values.reporterPhone.trim() || undefined,
          preferredContactMethod: values.preferredContactMethod,
          media,
        },
        actor
      )
      if (values.initialNote.trim()) {
        await incidentApi.addNote(created.id, values.initialNote.trim(), actor)
      }
      toast.success("Incident created.")
      navigate(`/admin/incidents/${created.id}/review`)
    } catch {
      toast.error("Could not create incident.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell
      title="Create incident"
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Incidents", to: "/admin/incidents" },
        { label: "Create" },
      ]}
    >
      <AdminPage>
        <Card className="bg-[var(--ajali-cream)]">
          <CardHeader>
            <CardTitle>Log an emergency report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reports received by phone, radio, walk-in, or another agency begin in Pending status.
            </p>
          </CardHeader>
          <CardContent>
            <IncidentForm
              values={values}
              onChange={setValues}
              onSubmit={submit}
              onCancel={() => navigate("/admin/incidents")}
              saving={saving}
              includeNote
              mediaSlot={
                <IncidentMediaPanel media={[]} draft={draftMedia} onDraftChange={setDraftMedia} />
              }
            />
          </CardContent>
        </Card>
      </AdminPage>
    </AdminShell>
  )
}

export { AdminIncidentCreatePage }
