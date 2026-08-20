import type { IncidentSeverity, IncidentStatus, IncidentUrgency, VerificationStatus } from "@/types/incident"
import {
  severityLabel,
  statusLabel,
  urgencyLabel,
  verificationStatusLabel,
} from "@/types/incident"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusClass: Record<IncidentStatus, string> = {
  PENDING: "border-[var(--status-pending)]/30 bg-[var(--status-pending)]/15 text-[var(--status-pending)]",
  VERIFIED: "border-[var(--status-verified)]/30 bg-[var(--status-verified)]/15 text-[var(--status-verified)]",
  IN_PROGRESS: "border-[var(--status-progress)]/30 bg-[var(--status-progress)]/15 text-[var(--status-progress)]",
  RESOLVED: "border-[var(--status-resolved)]/30 bg-[var(--status-resolved)]/15 text-[var(--status-resolved)]",
  CLOSED: "border-[var(--status-closed)]/30 bg-[var(--status-closed)]/15 text-[var(--status-closed)]",
}

const severityClass: Record<IncidentSeverity, string> = {
  MINOR: "border-[var(--severity-minor)]/30 bg-[var(--severity-minor)]/15 text-[var(--severity-minor)]",
  MODERATE: "border-[var(--severity-moderate)]/30 bg-[var(--severity-moderate)]/15 text-[var(--severity-moderate)]",
  MAJOR: "border-[var(--severity-major)]/30 bg-[var(--severity-major)]/15 text-[var(--severity-major)]",
  CRITICAL: "border-[var(--severity-critical)]/40 bg-[var(--severity-critical)]/20 text-[var(--severity-critical)]",
}

const urgencyClass: Record<IncidentUrgency, string> = {
  LOW: "border-[var(--urgency-low)]/30 bg-[var(--urgency-low)]/15 text-[var(--urgency-low)]",
  MEDIUM: "border-[var(--urgency-medium)]/30 bg-[var(--urgency-medium)]/15 text-[var(--urgency-medium)]",
  HIGH: "border-[var(--urgency-high)]/40 bg-[var(--urgency-high)]/15 text-[var(--urgency-high)]",
  CRITICAL: "border-[var(--urgency-critical)]/50 bg-[var(--urgency-critical)]/20 text-[var(--urgency-critical)] font-bold",
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[10px]", statusClass[status])}>
      {statusLabel(status)}
    </Badge>
  )
}

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <Badge variant="outline" className={cn("text-[10px]", severityClass[severity])}>
      {severityLabel(severity)}
    </Badge>
  )
}

function UrgencyBadge({ urgency }: { urgency: IncidentUrgency }) {
  return (
    <Badge variant="outline" className={cn("text-[10px]", urgencyClass[urgency])}>
      {urgencyLabel(urgency)} urgency
    </Badge>
  )
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const tone =
    status === "VERIFIED"
      ? "border-[var(--status-resolved)]/30 bg-[var(--status-resolved)]/15 text-[var(--status-resolved)]"
      : status === "FAILED"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-[var(--status-pending)]/30 bg-[var(--status-pending)]/15 text-[var(--status-pending)]"
  return (
    <Badge variant="outline" className={cn("text-[10px]", tone)}>
      {verificationStatusLabel(status)}
    </Badge>
  )
}

export { StatusBadge, SeverityBadge, UrgencyBadge, VerificationBadge }
