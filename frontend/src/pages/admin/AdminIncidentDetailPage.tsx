import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  fetchIncidentById,
  INCIDENT_STATUSES,
  statusLabel,
  updateIncidentStatus,
  type Incident,
} from "@/lib/incidents"

function AdminIncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchIncidentById(id)
      .then((record) => {
        if (!record) {
          setError("Incident not found.")
          setIncident(null)
          return
        }
        setIncident(record)
        setStatus(record.status)
        setError(null)
      })
      .catch(() => setError("Could not load incident."))
      .finally(() => setLoading(false))
  }, [id])

  async function saveStatus() {
    if (!incident || !status) return
    setSaving(true)
    try {
      const updated = await updateIncidentStatus(incident.id, status)
      if (!updated) {
        toast.error("Could not update status.")
        return
      }
      setIncident(updated)
      toast.success("Status updated.")
    } catch {
      toast.error("Could not update status.")
    } finally {
      setSaving(false)
    }
  }

  const when = incident?.createdAt
    ? format(new Date(incident.createdAt), "d MMMM yyyy, h:mm a")
    : "—"

  return (
    <AdminShell
      title="Incident details"
      end={
        <Link
          to="/admin/incidents"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to queue</span>
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 md:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => navigate("/admin/incidents")}>
              Back to queue
            </Button>
          </div>
        ) : incident ? (
          <>
            <Card className="bg-[var(--ajali-cream)]">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-lg">{incident.title}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {statusLabel(incident.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{incident.description}</p>
                <Separator />
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-right font-medium">{incident.location}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reported</dt>
                    <dd className="text-right">{when}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reporter ID</dt>
                    <dd className="font-mono text-xs">{incident.userId}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Incident status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="font-semibold"
                  disabled={saving || status === incident.status}
                  onClick={() => void saveStatus()}
                >
                  {saving ? "Saving…" : "Save status"}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}

export { AdminIncidentDetailPage }
