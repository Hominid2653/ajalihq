import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Incident = {
  id: number
  title: string
  description: string
  status: string
  location: string
}

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/incidents")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not reach json-server")
        }
        return response.json()
      })
      .then((data: Incident[]) => setIncidents(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load incidents")
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <Badge variant="secondary">AjaliHQ frontend</Badge>
          <CardTitle className="text-2xl">Vite + React + Tailwind + shadcn</CardTitle>
          <CardDescription>
            json-server is proxied at <code>/api</code> on port 3001.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading incidents...</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                {error}. Start the stack with <code>npm run dev</code>.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">{incident.location}</p>
                </div>
                <Badge variant="outline">{incident.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default App
