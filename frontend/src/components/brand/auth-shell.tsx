import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { authCardClass, brandStyle } from "@/lib/brand"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  children: ReactNode
  className?: string
  wide?: boolean
}

function AuthShell({ children, className, wide = false }: AuthShellProps) {
  return (
    <main
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10 text-foreground"
      style={brandStyle}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612] bg-[url('/splash.png')] bg-cover bg-center bg-no-repeat"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612]/45"
      />

      <div
        className={cn(
          "relative z-10 w-full rounded-2xl p-8",
          authCardClass,
          wide ? "max-w-md" : "max-w-[480px]",
          className
        )}
      >
        {children}
      </div>
      <p className="relative z-10 mt-6 max-w-sm text-center text-xs text-white/80">
        Proceeding means you&apos;re ok with our{" "}
        <Link className="font-semibold text-primary hover:underline" to="/terms">
          terms & conditions
        </Link>
        .
      </p>
    </main>
  )
}

export { AuthShell }
