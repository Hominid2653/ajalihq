import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Logomark } from "@/components/brand/logomark"
import { IncidentAwareness } from "@/components/public/incident-awareness"

function LandingPage() {
  return (
    <main className="relative flex min-h-svh flex-col bg-ajali-surface text-foreground">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Logomark className="mb-8" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Ajali!
          </h1>
          <p className="mt-4 max-w-sm text-lg font-semibold text-balance text-muted-foreground sm:text-xl">
            See it. Report it. Respond to it.
          </p>

          <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
            <Button
              size="lg"
              className="h-12 w-full text-base font-bold"
              asChild
            >
              <Link to="/signin">Report</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-border text-base font-bold"
              asChild
            >
              <Link to="/signin">Sign in</Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-full text-base font-bold"
              asChild
            >
              <Link to="/signin">View incidences</Link>
            </Button>
            <p className="pt-2 text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                className="font-bold text-primary underline-offset-4 hover:underline"
                to="/signup"
              >
                Sign up
              </Link>
            </p>
            <p className="pt-1 text-sm text-muted-foreground">
              <Link
                className="font-bold text-primary underline-offset-4 hover:underline"
                to="/home"
              >
                Home
              </Link>
            </p>
          </div>
        </div>

        <IncidentAwareness />
      </div>

      <footer className="relative z-10 flex flex-col items-center gap-3 border-t border-border px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-8">
        <p>© 2026 Ajali!</p>
        <nav className="flex items-center gap-6">
          <Link className="transition-colors hover:text-foreground" to="/home">
            Home
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/terms">
            Terms
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            to="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="transition-colors hover:text-foreground"
            to="/support"
          >
            Help & support
          </Link>
        </nav>
      </footer>
    </main>
  )
}

export { LandingPage }
