import type { Incident, IncidentInput } from "@/types/incident"

const BASE_URL = "/api/incidents"

function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `AJH-${year}-${random}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(
      `Request failed (${response.status}): ${body || response.statusText}`
    )
  }
  return response.json() as Promise<T>
}

export async function listIncidents(): Promise<Incident[]> {
  const response = await fetch(BASE_URL)
  return handleResponse<Incident[]>(response)
}

export async function getIncident(id: number | string): Promise<Incident> {
  const response = await fetch(`${BASE_URL}/${id}`)
  return handleResponse<Incident>(response)
}

export async function createIncident(
  input: IncidentInput,
  userId: number = 1
): Promise<Incident> {
  const payload = {
    ...input,
    referenceNumber: generateReferenceNumber(),
    status: "reported" as const,
    userId,
    createdAt: new Date().toISOString(),
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse<Incident>(response)
}

export async function updateIncident(
  id: number | string,
  input: Partial<IncidentInput>
): Promise<Incident> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, updatedAt: new Date().toISOString() }),
  })
  return handleResponse<Incident>(response)
}

// Soft action: flips status to "withdrawn" rather than removing the record.
export async function withdrawIncident(id: number | string): Promise<Incident> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "withdrawn",
      updatedAt: new Date().toISOString(),
    }),
  })
  return handleResponse<Incident>(response)
}

// Hard action: removes the record entirely.
export async function deleteIncident(id: number | string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" })
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(
      `Request failed (${response.status}): ${body || response.statusText}`
    )
  }
}