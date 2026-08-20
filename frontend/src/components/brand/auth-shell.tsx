import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { brandStyle } from "@/lib/brand"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  children: ReactNode
  className?: string
  wide?: boolean
}

function AuthShell({ children, className, wide = false }: AuthShellProps) {
  return (
    <main
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={brandStyle}
    >
      {/* Splash background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612] bg-[url('/splash.png')] bg-cover bg-center bg-no-repeat"
      />
      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0a0612]/50"
      />

      {/* Auth card - white surface, uses semantic tokens */}
      <div
        className={cn(
          "relative z-10 w-full rounded-[var(--radius-2xl)] bg-[var(--ajali-surface)] p-8 text-foreground shadow-elevated ring-1 ring-border",
          wide ? "max-w-md" : "max-w-[440px]",
          className
        )}
      >
        {children}
      </div>

      <p className="relative z-10 mt-5 max-w-sm text-center text-xs text-white/70">
        Proceeding means you&apos;re ok with our{" "}
        <Link
          className="font-semibold text-[var(--ajali-primary)] hover:underline"
          to="/terms"
        >
          terms &amp; conditions
        </Link>
        .
      </p>
    </main>
  )
}

export { AuthShell }
