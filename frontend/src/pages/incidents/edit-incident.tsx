import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

//Importing reusable components from UI folder 

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { IncidentForm } from "@/components/incidents/incident-form"
import { getIncident, updateIncident } from "@/api/incidents"
import type { Incident, IncidentInput } from "@/types/incident"

export function EditIncidentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getIncident(id)
      .then(setIncident)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load incident")
      )
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(values: IncidentInput) {
    if (!id) return
    await updateIncident(id, values)
    navigate(`/incidents/${id}`)
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading incident...</p>
      </main>
    )
  }

  if (error || !incident) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-destructive">{error ?? "Incident not found."}</p>
        <Button variant="outline" onClick={() => navigate("/incidents")}>
          Back to incidents
        </Button>
      </main>
    )
  }

  if (incident.status !== "reported") {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-muted-foreground">
          This incident is already {incident.status} and can no longer be edited.
        </p>
        <Button variant="outline" onClick={() => navigate(`/incidents/${incident.id}`)}>
          View incident
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit incident</CardTitle>
          <CardDescription>{incident.referenceNumber}</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentForm
            mode="edit"
            initialValues={{
              title: incident.title,
              description: incident.description,
              incidentType: incident.incidentType,
              severity: incident.severity,
              location: incident.location,
            }}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  )
}