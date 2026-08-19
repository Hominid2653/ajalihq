import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Search, X } from "lucide-react"

import { ReportRow } from "@/components/user/report-row"
import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchIncidents, type Incident } from "@/lib/incidents"

function SearchPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(() => setIncidents([]))
  }, [])

  const results = useMemo(() => {
    const term = submitted.trim().toLowerCase()
    if (!term) return incidents
    return incidents.filter((incident) =>
      [incident.title, incident.location, incident.status, incident.description]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [incidents, submitted])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(query)
  }

  return (
    <UserShell
      title="Search reports"
      end={
        <Link to="/reports" aria-label="Close search">
          <X className="size-5 text-neutral-800" />
        </Link>
      }
    >
      <form className="flex gap-2 px-4 py-4" onSubmit={onSubmit}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter a search term"
          className="h-11 bg-white"
        />
        <Button className="size-11 shrink-0" size="icon" type="submit" aria-label="Search">
          <Search className="size-5" />
        </Button>
      </form>
      <div className="flex flex-col gap-2 px-4 pb-6">
        {results.map((incident) => (
          <ReportRow key={incident.id} incident={incident} />
        ))}
      </div>
    </UserShell>
  )
}

export { SearchPage }
