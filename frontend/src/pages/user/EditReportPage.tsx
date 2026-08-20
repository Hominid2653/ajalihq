import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import {
  CitizenIncidentForm,
  type CitizenIncidentFormValues,
} from "@/components/user/citizen-incident-form"
import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchIncidentById,
  isCitizenEditable,
  updateMyIncident,
  type Incident,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function EditReportPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user) return
    setLoading(true)
    fetchIncidentById(id)
      .then((record) => {
        if (!record) {
          setError("Incident not found.")
          return
        }
        if (record.userId !== user.id) {
          setError("You can only edit your own reports.")
          return
        }
        if (!isCitizenEditable(record)) {
          setError("Only pending reports can be edited.")
          return
        }
        setIncident(record)
        setError(null)
      })
      .catch(() => setError("Could not load incident."))
      .finally(() => setLoading(false))
  }, [id, user])

  async function onSubmit(values: CitizenIncidentFormValues) {
    if (!user || !incident) throw new Error("Missing session or report.")
    const updated = await updateMyIncident(
      incident.id,
      {
        title: values.title,
        description: values.description,
        location: values.location,
        type: values.type,
        urgency: values.urgency,
        severity: values.severity,
        lat: values.lat,
        lng: values.lng,
        reporterPhone: values.reporterPhone,
        reporterEmail: values.reporterEmail,
        preferredContactMethod: values.preferredContactMethod,
      },
      { id: user.id, name: user.name }
    )
    toast.success("Report updated.")
    navigate(`/reports/${updated.id}`, { replace: true })
  }

  return (
    <UserShell
      title="Edit report"
      end={
        <Link
          to={incident ? `/reports/${incident.id}` : "/reports"}
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
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              Back to reports
            </Button>
          </div>
        ) : incident ? (
          <CitizenIncidentForm
            mode="edit"
            incidentId={incident.id}
            actor={user ? { id: user.id, name: user.name } : null}
            initialValues={{
              title: incident.title,
              description: incident.description,
              location: incident.location,
              type: incident.type,
              urgency: incident.urgency,
              severity: incident.severity,
              reporterPhone: incident.reporterPhone ?? "",
              reporterEmail: incident.reporterEmail ?? "",
              preferredContactMethod:
                incident.preferredContactMethod ?? "PHONE",
              lat: incident.lat,
              lng: incident.lng,
            }}
            onSubmit={onSubmit}
            submitLabel="Save changes"
          />
        ) : null}
      </div>
    </UserShell>
  )
}

export { EditReportPage }
