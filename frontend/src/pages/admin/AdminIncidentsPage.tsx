import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { format, formatDistanceToNow } from "date-fns"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import {
  SeverityBadge,
  StatusBadge,
  UrgencyBadge,
  VerificationBadge,
} from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { departmentApi } from "@/services/department-api"
import { handoffApi } from "@/services/handoff-api"
import { incidentApi } from "@/services/incident-api"
import type {
  Department,
  DepartmentHandoff,
  IncidentListItem,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  IncidentUrgency,
  VerificationStatus,
} from "@/types/incident"
import { typeLabel } from "@/types/incident"
import { cn } from "@/lib/utils"

const statuses: IncidentStatus[] = ["PENDING", "VERIFIED", "IN_PROGRESS", "RESOLVED", "CLOSED"]
const urgencies: IncidentUrgency[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
const severities: IncidentSeverity[] = ["MINOR", "MODERATE", "MAJOR", "CRITICAL"]
const types: IncidentType[] = ["accident", "fire", "medical", "crime", "disaster"]

function IncidentActions({ incident }: { incident: IncidentListItem }) {
  const isPending = incident.status === "PENDING"
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {isPending ? (
        <Link
          to={`/admin/incidents/${incident.id}/review`}
          className="rounded-md bg-primary px-2.5 py-1 text-primary-foreground hover:bg-primary/90"
        >
          Review
        </Link>
      ) : null}
      <Link to={`/admin/incidents/${incident.id}`} className="text-primary hover:underline">
        View
      </Link>
      {!isPending ? (
        <Link to={`/admin/incidents/${incident.id}/review`} className="text-primary hover:underline">
          Review
        </Link>
      ) : null}
      <Link to={`/admin/incidents/${incident.id}/edit`} className="text-primary hover:underline">
        Edit
      </Link>
    </div>
  )
}

function AdminIncidentsPage() {
  const [searchParams] = useSearchParams()
  const [incidents, setIncidents] = useState<IncidentListItem[]>([])
  const [handoffs, setHandoffs] = useState<DepartmentHandoff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(() => {
    const value = searchParams.get("status")
    return value && statuses.includes(value as IncidentStatus) ? value : "all"
  })
  const [urgency, setUrgency] = useState(() => {
    const value = searchParams.get("urgency")
    return value && urgencies.includes(value as IncidentUrgency) ? value : "all"
  })
  const [severity, setSeverity] = useState("all")
  const [type, setType] = useState("all")
  const [department, setDepartment] = useState("all")
  const [verification, setVerification] = useState("all")
  const [location, setLocation] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    setLoading(true)
    setError("")
    const query = {
      search: search.trim() || undefined,
      status: status === "all" ? undefined : (status as IncidentStatus),
      urgency: urgency === "all" ? undefined : (urgency as IncidentUrgency),
      severity: severity === "all" ? undefined : (severity as IncidentSeverity),
      type: type === "all" ? undefined : (type as IncidentType),
      departmentId: department === "all" ? undefined : department,
      verificationStatus:
        verification === "all" ? undefined : (verification as VerificationStatus),
      location: location.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: "urgency" as const,
    }

    Promise.all([
      incidentApi.getAll(query),
      handoffApi.getAll(),
      departmentApi.getAll(),
    ])
      .then(([list, nextHandoffs, nextDepartments]) => {
        setIncidents(list)
        setHandoffs(nextHandoffs)
        setDepartments(nextDepartments)
      })
      .catch(() => setError("Could not load incidents."))
      .finally(() => setLoading(false))
  }, [
    search,
    status,
    urgency,
    severity,
    type,
    department,
    verification,
    location,
    dateFrom,
    dateTo,
  ])

  const deptByIncident = useMemo(() => {
    const map = new Map<string, string[]>()
    const nameById = new Map(departments.map((d) => [d.id, d.name]))
    for (const handoff of handoffs) {
      const names = map.get(handoff.incidentId) ?? []
      const name = nameById.get(handoff.departmentId)
      if (name && !names.includes(name)) names.push(name)
      map.set(handoff.incidentId, names)
    }
    return map
  }, [departments, handoffs])

  const pages = Math.max(1, Math.ceil(incidents.length / pageSize))
  const visible = incidents.slice((page - 1) * pageSize, page * pageSize)

  function clearFilters() {
    setSearch("")
    setStatus("all")
    setUrgency("all")
    setSeverity("all")
    setType("all")
    setDepartment("all")
    setVerification("all")
    setLocation("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  return (
    <AdminShell
      title="Incident inbox"
      end={
        <Button asChild>
          <Link to="/admin/incidents/new">Create incident</Link>
        </Button>
      }
    >
      <AdminPage wide className="space-y-4">
        {error ? <p className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="xl:col-span-2"
          />
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>{value.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={(value) => { setUrgency(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgencies</SelectItem>
              {urgencies.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(value) => { setSeverity(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {severities.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(value) => { setType(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((value) => (
                <SelectItem key={value} value={value}>{typeLabel(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={(value) => { setDepartment(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((value) => (
                <SelectItem key={value.id} value={value.id}>{value.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={verification} onValueChange={(value) => { setVerification(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Verification" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All verification</SelectItem>
              <SelectItem value="PENDING">Not verified</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Location filter…"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value)
              setPage(1)
            }}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value)
              setPage(1)
            }}
            aria-label="Date from"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value)
              setPage(1)
            }}
            aria-label="Date to"
          />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
          </div>
        </div>

        {loading ? <Skeleton className="h-64" /> : null}
        {!loading && incidents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No incidents match your filters.
            </CardContent>
          </Card>
        ) : null}

        {!loading && visible.length > 0 ? (
          <div className="hidden overflow-x-auto rounded-xl border bg-background lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((incident) => (
                  <TableRow
                    key={incident.id}
                    className={cn(incident.status === "PENDING" && "bg-primary/[0.03]")}
                  >
                    <TableCell><UrgencyBadge urgency={incident.urgency} /></TableCell>
                    <TableCell className="font-mono text-xs">{incident.reference}</TableCell>
                    <TableCell>{typeLabel(incident.type)}</TableCell>
                    <TableCell className="max-w-40 truncate">{incident.location}</TableCell>
                    <TableCell><StatusBadge status={incident.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                      <div className="text-muted-foreground">{format(new Date(incident.createdAt), "d MMM")}</div>
                    </TableCell>
                    <TableCell>
                      <VerificationBadge status={incident.verificationStatus} />
                    </TableCell>
                    <TableCell className="max-w-36 truncate text-xs">
                      {(deptByIncident.get(incident.id) ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell><SeverityBadge severity={incident.severity} /></TableCell>
                    <TableCell>
                      <IncidentActions incident={incident} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <div className="grid gap-3 lg:hidden">
          {!loading &&
            visible.map((incident) => (
              <Card key={incident.id} className="bg-[var(--ajali-cream)]">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{incident.reference}</p>
                      <p className="font-semibold">{incident.title}</p>
                    </div>
                    <UrgencyBadge urgency={incident.urgency} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {typeLabel(incident.type)} · {incident.location}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={incident.status} />
                    <SeverityBadge severity={incident.severity} />
                    <VerificationBadge status={incident.verificationStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Received {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                  </p>
                  <IncidentActions incident={incident} />
                </CardContent>
              </Card>
            ))}
        </div>

        {!loading && incidents.length > 0 ? (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span className="text-sm">Page {page} of {pages}</span>
            <Button variant="outline" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        ) : null}
      </AdminPage>
    </AdminShell>
  )
}

export { AdminIncidentsPage }
