import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import {
  getIncident,
  isCitizenEditable,
  updateIncident,
  type IncidentInput,
} from "@/api/incidents"
import { IncidentForm } from "@/components/incidents/incident-form"
import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Incident } from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function EditIncidentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIncident(id)
      .then((record) => {
        if (!isCitizenEditable(record)) {
          setError("Only pending incidents can be edited.")
          setIncident(null)
          return
        }
        setIncident(record)
        setError(null)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load incident")
      )
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(values: IncidentInput) {
    if (!id) return
    const updated = await updateIncident(id, values)
    toast.success("Incident updated.")
    navigate(`/incidents/${updated.id}`, { replace: true })
  }

  return (
    <UserShell
      title="Edit incident"
      end={
        <Link
          to={incident ? `/incidents/${incident.id}` : "/incidents"}
          aria-label="Back"
          className="inline-flex items-center gap-1 text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : error || !incident ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error ?? "Incident not found."}</p>
            <Button variant="outline" onClick={() => navigate("/incidents")}>
              Back to incidents
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs font-medium text-muted-foreground">
              {incident.reference}
            </p>
            <IncidentForm
              mode="edit"
              incidentId={incident.id}
              actor={user ? { id: user.id, name: user.name } : null}
              initialValues={{
                title: incident.title,
                description: incident.description,
                type: incident.type,
                urgency: incident.urgency,
                severity: incident.severity,
                location: incident.location,
                reporterPhone: incident.reporterPhone ?? "",
                reporterEmail: incident.reporterEmail ?? "",
                preferredContactMethod:
                  incident.preferredContactMethod ?? "PHONE",
                lat: incident.lat,
                lng: incident.lng,
              }}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
            />
          </>
        )}
      </div>
    </UserShell>
  )
}

export { EditIncidentPage }
