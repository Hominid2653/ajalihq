import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"

import { AdminShell } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchAllIncidents,
  isUnsetStatus,
  statusLabel,
  type Incident,
} from "@/lib/incidents"
import { cn } from "@/lib/utils"

function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllIncidents()
      .then(setIncidents)
      .catch(() => setError("Could not load incidents."))
  }, [])

  return (
    <AdminShell title="Incident queue">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
        {error ? (
          <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => {
                const unset = isUnsetStatus(incident.status)
                const when = incident.createdAt
                  ? format(new Date(incident.createdAt), "d MMM yyyy, h:mm a")
                  : "—"
                return (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Link
                        to={`/admin/incidents/${incident.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {incident.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate sm:table-cell text-muted-foreground">
                      {incident.location}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={unset ? "destructive" : "secondary"}
                        className={cn("capitalize text-[10px]")}
                      >
                        {statusLabel(incident.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {when}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  )
}

export { AdminIncidentsPage }
