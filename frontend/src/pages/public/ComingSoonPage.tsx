import { Link } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"

function ComingSoonPage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <Logomark className="mb-6 h-16" />
        <h1 className="text-2xl font-bold">Sorry!</h1>
        <p className="mt-3 max-w-xs text-sm text-pretty text-neutral-700">
          This part of Ajali! is still being built. You can keep reporting and
          reviewing from the dashboard.
        </p>
      </div>
      <Button className="mt-8 h-12 w-full text-base font-bold" size="lg" asChild>
        <Link to="/dashboard">Continue</Link>
      </Button>
    </AuthShell>
  )
}

export { ComingSoonPage }
