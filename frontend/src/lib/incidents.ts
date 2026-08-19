export type Incident = {
  id: number | string
  title: string
  description: string
  status: string
  location: string
  createdAt?: string
}

export function statusLabel(status: string) {
  if (!status || status === "reported") return "Status Not Set"
  return status.replaceAll("_", " ")
}

export function isUnsetStatus(status: string) {
  return !status || ["reported", "pending", "new"].includes(status.toLowerCase())
}

export async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch("/api/incidents", {
    signal: AbortSignal.timeout(4000),
  })
  if (!response.ok) throw new Error("Could not load incidents")
  const payload: unknown = await response.json()
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: Incident[] }).data ?? [])
  return list as Incident[]
}
