import { Badge } from "@/components/ui/badge"
import { severityLabel, type IncidentSeverity } from "@/lib/incidents"

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <Badge variant="outline" className="text-[10px] capitalize">
      {severityLabel(severity)}
    </Badge>
  )
}

export { SeverityBadge }
