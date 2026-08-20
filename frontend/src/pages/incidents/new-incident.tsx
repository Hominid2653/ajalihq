import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { createIncident, type IncidentInput } from "@/api/incidents"
import { IncidentForm } from "@/components/incidents/incident-form"
import { UserShell } from "@/components/user/user-shell"
import { useAuth } from "@/store/hooks"

function NewIncidentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleSubmit(values: IncidentInput) {
    const incident = await createIncident(values)
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
