import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { adminApi } from "@/services/admin-api"
import type { AuditAction, AuditLog } from "@/types/incident"

const ACTIONS: AuditAction[] = [
  "REPORT_CREATED",
  "REPORT_UPDATED",
  "REPORT_VERIFIED",
  "REPORT_CLOSED",
  "RESPONSE_STARTED",
  "DEPARTMENT_ASSIGNED",
  "DEPARTMENT_HANDOFF_UPDATED",
  "DEPARTMENT_CREATED",
  "DEPARTMENT_UPDATED",
  "INCIDENT_RESOLVED",
  "INCIDENT_REOPENED",
  "INCIDENT_ARCHIVED",
  "MEDIA_ADDED",
  "MEDIA_REMOVED",
  "NOTE_ADDED",
  "CITIZEN_NOTIFIED",
  "URGENCY_UPDATED",
  "SEVERITY_UPDATED",
]

function incidentLabel(item: AuditLog) {
  return item.incidentReference || item.incidentId || "—"
}

function AdminAuditLogPage() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [action, setAction] = useState("all")

  useEffect(() => {
    adminApi
      .getAuditLogs()
      .then(setItems)
      .catch(() => setError("Could not load the audit log."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesAction = action === "all" || item.action === action
      const haystack = [
        item.actorName,
        item.action,
        item.incidentReference,
        item.incidentId,
        item.reason,
        item.previousValue,
        item.newValue,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesSearch = !q || haystack.includes(q)
      return matchesAction && matchesSearch
    })
  }, [action, items, search])

  return (
    <AdminShell title="Audit log">
      <AdminPage wide className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="Search actor, action, incident…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="lg:col-span-2"
          />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No administrative actions match these filters.
            </CardContent>
          </Card>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto rounded-xl border lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Incident</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(item.createdAt), "d MMM yyyy, h:mm a")}
                      </TableCell>
                      <TableCell>{item.actorName}</TableCell>
                      <TableCell className="font-medium">{item.action}</TableCell>
                      <TableCell>
                        {item.incidentId ? (
                          <Link
                            className="font-mono text-xs text-primary hover:underline"
                            to={`/admin/incidents/${item.incidentId}`}
                          >
                            {incidentLabel(item)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{item.previousValue || "—"}</TableCell>
                      <TableCell>{item.newValue || "—"}</TableCell>
                      <TableCell className="max-w-64">{item.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filtered.map((item) => (
                <Card key={item.id} className="bg-[var(--ajali-cream)]">
                  <CardContent className="space-y-2 pt-5 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "d MMM, h:mm a")}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{item.actorName}</p>
                    {item.incidentId ? (
                      <Link
                        className="font-mono text-xs font-semibold text-primary"
                        to={`/admin/incidents/${item.incidentId}`}
                      >
                        {incidentLabel(item)}
                      </Link>
                    ) : null}
                    {(item.previousValue || item.newValue) ? (
                      <p className="text-xs">
                        {item.previousValue || "—"} → {item.newValue || "—"}
                      </p>
                    ) : null}
                    {item.reason ? <p className="text-xs">{item.reason}</p> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </AdminPage>
    </AdminShell>
  )
}

export { AdminAuditLogPage }
