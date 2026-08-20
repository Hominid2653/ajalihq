import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { createIncident, type IncidentInput } from "@/api/incidents"
import {
  IncidentForm,
  type IncidentFormValues,
} from "@/components/incidents/incident-form"
import { UserShell } from "@/components/user/user-shell"
import { useAuth } from "@/store/hooks"

function NewIncidentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleSubmit(values: IncidentFormValues) {
    const payload: IncidentInput = {
      title: values.title,
      description: values.description,
      type: values.type,
      urgency: values.urgency,
      severity: values.severity,
      location: values.location,
      reporterPhone: values.reporterPhone,
      reporterEmail: values.reporterEmail,
      preferredContactMethod: values.preferredContactMethod,
      lat: values.lat,
      lng: values.lng,
      media: values.media,
    }
    const incident = await createIncident(payload)
    toast.success("Incident reported.")
    navigate(`/incidents/${incident.id}`, { replace: true })
  }

  return (
    <UserShell
      title="Report incident"
      end={
        <Link to="/incidents" className="text-sm font-semibold text-primary">
          Cancel
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8">
        <p className="mb-4 text-sm text-muted-foreground">
          Fill in the details below. A reference number is assigned when you submit.
        </p>
        <IncidentForm
          mode="create"
          initialValues={{
            reporterEmail: user?.email ?? "",
            reporterPhone: user?.phone ?? "",
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </UserShell>
  )
}

export { NewIncidentPage }
