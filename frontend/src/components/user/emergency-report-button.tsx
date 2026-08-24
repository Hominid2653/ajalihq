import { Link } from "react-router-dom"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

type EmergencyReportButtonProps = {
  className?: string
  /** Compact variant for tighter layouts */
  size?: "default" | "lg"
}

function EmergencyReportButton({
  className,
  size = "lg",
}: EmergencyReportButtonProps) {
  const dim = size === "lg" ? "size-36 sm:size-40" : "size-28"

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Link
        to="/incidents/new"
        aria-label="Report an emergency incident"
        className={cn(
          "group relative flex items-center justify-center rounded-full",
          "bg-destructive text-white shadow-lg shadow-destructive/40",
          "transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/40",
          dim
        )}
      >
        <span className="emergency-ripple" aria-hidden />
        <span className="emergency-ripple" aria-hidden />
        <span className="emergency-ripple" aria-hidden />
        <span className="relative z-10 flex flex-col items-center gap-1.5 px-4 text-center">
          <TriangleAlert className="size-8 sm:size-9 md:size-10" strokeWidth={2.25} />
          <span className="text-sm font-extrabold tracking-wide uppercase sm:text-base">
            Emergency
          </span>
        </span>
      </Link>
      <p className="max-w-[16rem] text-center text-sm text-muted-foreground">
        Tap to report an incident. Help is one step away.
      </p>
    </div>
  )
}

export { EmergencyReportButton }
