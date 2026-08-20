import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import {
  emptyIncidentForm,
  IncidentForm,
  type IncidentFormValues,
} from "@/components/admin/incident-form"
import { SeverityBadge, StatusBadge, UrgencyBadge } from "@/components/admin/status-badge"
import { IncidentMediaPanel, type PendingMedia } from "@/components/shared/incident-media-panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAdminActor } from "@/hooks/use-admin-actor"
import { typeLabel } from "@/types/incident"
import { incidentApi } from "@/services/incident-api"
import { toDurableMediaUrl } from "@/services/media-api"
import type { Incident } from "@/types/incident"

async function durableDraftMedia(items: PendingMedia[]) {
  return Promise.all(
    items.map(async (item) => {
      if (item.file) {
        const url = await toDurableMediaUrl(item.file)
        return { kind: item.kind, url, name: item.name }
      }
      // Sanitize blob URLs via the same contract as mediaApi.add
      const url = item.url.startsWith("blob:")
        ? item.kind === "video"
          ? "/icons.svg"
          : "/splash.png"
        : item.url
      return { kind: item.kind, url, name: item.name }
    })
  )
}

function QuickCreateIncidentButton({
  onCreated,
  className,
}: {
  onCreated?: (incident: Incident) => void
  className?: string
}) {
  const actor = useAdminActor()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<IncidentFormValues>(emptyIncidentForm)
  const [draftMedia, setDraftMedia] = useState<PendingMedia[]>([])
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<Incident | null>(null)

  function reset() {
    setValues(emptyIncidentForm)
    setDraftMedia([])
    setCreated(null)
    setSaving(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actor) return toast.error("Your admin session is unavailable.")
    setSaving(true)
    try {
      const title =
        values.title.trim() ||
        `${typeLabel(values.type)} — ${values.location.trim() || "Reported incident"}`
      const media = await durableDraftMedia(draftMedia)
      const incident = await incidentApi.create(
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
        await incidentApi.addNote(incident.id, values.initialNote.trim(), actor)
      }
      setCreated(incident)
      onCreated?.(incident)
      toast.success("Incident created.")
    } catch {
      toast.error("Could not create incident.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className={className} size="sm">
          <Plus className="mr-1 size-4" />
          Add report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Incident successfully created</DialogTitle>
              <DialogDescription>The report is in the operations queue.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 rounded-xl bg-[var(--ajali-cream)] p-4">
              <p className="font-mono text-sm font-semibold">{created.reference}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={created.status} />
                <UrgencyBadge urgency={created.urgency} />
                <SeverityBadge severity={created.severity} />
              </div>
              <p className="text-sm font-medium">{created.title}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => { reset() }}>
                Continue creating
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button asChild>
                <Link to={`/admin/incidents/${created.id}/review`} onClick={() => setOpen(false)}>
                  Open incident
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quick create incident</DialogTitle>
              <DialogDescription>
                Log a phone, radio, walk-in, or agency report in seconds.
              </DialogDescription>
            </DialogHeader>
            <IncidentForm
              compact
              includeNote
              values={values}
              onChange={setValues}
              onSubmit={submit}
              onCancel={() => setOpen(false)}
              saving={saving}
              mediaSlot={
                <IncidentMediaPanel
                  media={[]}
                  draft={draftMedia}
                  onDraftChange={setDraftMedia}
                />
              }
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { QuickCreateIncidentButton }
