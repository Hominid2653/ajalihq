import { useNavigate } from "react-router-dom"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IncidentForm } from "@/components/incidents/incident-form"
import { createIncident } from "@/api/incidents"
import type { IncidentInput } from "@/types/incident"

export function NewIncidentPage() {
  const navigate = useNavigate()

  async function handleSubmit(values: IncidentInput) {
    const incident = await createIncident(values)
    navigate(`/incidents/${incident.id}`)
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Report an incident</CardTitle>
          <CardDescription>
            Fill in the details below. A reference number will be generated
            once you submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentForm mode="create" onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </main>
  )
}