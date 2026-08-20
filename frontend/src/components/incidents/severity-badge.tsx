import { Badge } from "@/components/ui/badge"
import { SEVERITY_LABELS, type Severity } from "@/types/incident"
import { cn } from "@/lib/utils"

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="outline" className={cn("border-0", SEVERITY_STYLES[severity])}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}