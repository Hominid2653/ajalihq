import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, type IncidentStatus } from "@/types/incident"

const STATUS_VARIANT: Record<
  IncidentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  reported: "secondary",
  investigating: "default",
  resolved: "outline",
  withdrawn: "destructive",
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
}