import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"

import { ReportRow } from "@/components/user/report-row"
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
  isUnsetStatus,
  severityLabel,
  statusLabel,
  typeLabel,
  type Incident,
} from "@/lib/incidents"
import { cn } from "@/lib/utils"

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  const s = (status ?? "").toLowerCase()
  if (s === "verified") return "secondary"
  if (s === "in_progress") return "outline"
  if (s === "resolved") return "default"
  if (s === "closed") return "outline"
  return "destructive"
}

/** Mobile / small screens — card stack */
function ReportsMobileList({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="grid gap-2 md:hidden">
      {incidents.map((incident) => (
        <ReportRow key={incident.id} incident={incident} />
      ))}
    </div>
  )
}

/** Desktop / tablet — data table */
function ReportsDesktopTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Reference</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden lg:table-cell">Type</TableHead>
            <TableHead className="hidden xl:table-cell">Severity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Reported</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => {
            const unset = isUnsetStatus(incident.status)
            return (
              <TableRow key={incident.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {incident.reference}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/reports/${incident.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {incident.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {typeLabel(incident.type)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {severityLabel(incident.severity)}
                </TableCell>
                <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                  {incident.location}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant(incident.status)}
                    className={cn(
                      "capitalize text-[10px]",
                      unset &&
                        "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {statusLabel(incident.status)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                  {format(new Date(incident.createdAt), "d MMM yyyy")}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/reports/${incident.id}`}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                    aria-label={`Open ${incident.reference}`}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export { ReportsDesktopTable, ReportsMobileList }
