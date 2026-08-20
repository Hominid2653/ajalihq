import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"

import { UserShell } from "@/components/user/user-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  fetchIncidentById,
  isUnsetStatus,
  statusLabel,
  typeLabel,
  type Incident,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"
import { cn } from "@/lib/utils"

function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchIncidentById(id)
      .then((record) => {
        if (!record) {
          setError("Incident not found.")
          return
        }
        // Citizens may only view their own reports
        if (!isAdmin && user && record.userId !== user.id) {
          setError("You do not have access to this report.")
          setIncident(null)
          return
        }
        setIncident(record)
        setError(null)
      })
      .catch(() => setError("Could not load incident."))
      .finally(() => setLoading(false))
  }, [id, user, isAdmin])

  const when = incident?.createdAt
    ? format(new Date(incident.createdAt), "d MMMM yyyy, h:mm a")
    : "—"

  return (
    <UserShell
      title="Report details"
      end={
        <Link
          to="/reports"
          aria-label="Back to reports"
          className="inline-flex items-center gap-1 text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 md:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              Back to reports
            </Button>
          </div>
        ) : incident ? (
          <Card className="bg-[var(--ajali-cream)]">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-lg">{incident.title}</CardTitle>
                <Badge
                  variant={isUnsetStatus(incident.status) ? "destructive" : "secondary"}
                  className={cn("capitalize")}
                >
                  {statusLabel(incident.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{incident.description}</p>
              <Separator />
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{typeLabel(incident.type)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-right font-medium">{incident.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reported</dt>
                  <dd className="text-right">{when}</dd>
                </div>
              </dl>
              {isAdmin ? (
                <Button className="mt-2 w-full font-semibold" asChild>
                  <Link to={`/admin/incidents/${incident.id}`}>
                    Manage in admin
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </UserShell>
  )
}

export { IncidentDetailPage }
