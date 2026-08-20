import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import {
  CitizenIncidentForm,
  type CitizenIncidentFormValues,
} from "@/components/user/citizen-incident-form"
import { UserShell } from "@/components/user/user-shell"
import { createIncident } from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function ReportIncidentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(values: CitizenIncidentFormValues) {
    if (!user) throw new Error("You must be signed in to report an incident.")
    const incident = await createIncident({
      title: values.title,
      description: values.description,
      location: values.location,
      type: values.type,
      severity: values.severity,
      userId: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
      reporterPhone: user.phone,
    })
    toast.success("Report submitted.")
    navigate(`/reports/${incident.id}`, { replace: true })
  }

  return (
    <UserShell
      title="Report incident"
      end={
        <Link to="/reports" className="text-sm font-semibold text-primary">
          Cancel
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8">
        <CitizenIncidentForm mode="create" onSubmit={onSubmit} />
      </div>
    </UserShell>
  )
}

export { ReportIncidentPage }
