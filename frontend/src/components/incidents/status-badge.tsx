import { Badge } from "@/components/ui/badge"
import { isUnsetStatus, statusLabel, type IncidentStatus } from "@/lib/incidents"
import { cn } from "@/lib/utils"

function statusVariant(
  status: IncidentStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "VERIFIED":
      return "secondary"
    case "IN_PROGRESS":
      return "outline"
    case "RESOLVED":
      return "default"
    case "CLOSED":
      return "outline"
    default:
      return "destructive"
  }
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const unset = isUnsetStatus(status)
  return (
    <Badge
      variant={statusVariant(status)}
      className={cn(
        "capitalize text-[10px]",
        unset && "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}

export { StatusBadge }
