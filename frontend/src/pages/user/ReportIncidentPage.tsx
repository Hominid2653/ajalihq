import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createIncident,
  INCIDENT_TYPES,
  type IncidentType,
} from "@/lib/incidents"
import { useAuth } from "@/store/hooks"

function ReportIncidentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [type, setType] = useState<IncidentType>("accident")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setError(null)

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Fill in title, description, and location.")
      return
    }

    setPending(true)
    try {
      const incident = await createIncident({
        title,
        description,
        location,
        type,
        userId: user.id,
      })
      toast.success("Report submitted.")
      navigate(`/reports/${incident.id}`, { replace: true })
    } catch {
      setError("Could not submit report. Try again.")
    } finally {
      setPending(false)
    }
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
      <form
        className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6 md:px-8"
        onSubmit={onSubmit}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="type">Incident type</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as IncidentType)}
          >
            <SelectTrigger id="type" className="h-11 w-full bg-[var(--ajali-surface)]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="h-11 bg-[var(--ajali-surface)]"
            placeholder="Short summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            className="h-11 bg-[var(--ajali-surface)]"
            placeholder="Street, estate, or landmark"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            className="min-h-28 bg-[var(--ajali-surface)]"
            placeholder="What happened? Any injuries or hazards?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 font-bold"
          disabled={pending}
        >
          {pending ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </UserShell>
  )
}

export { ReportIncidentPage }
