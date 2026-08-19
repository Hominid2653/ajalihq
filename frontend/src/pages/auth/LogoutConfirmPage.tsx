import { useNavigate } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { clearSession } from "@/lib/auth"

function LogoutConfirmPage() {
  const navigate = useNavigate()

  function continueToLogin() {
    clearSession()
    navigate("/signin", { replace: true })
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <Logomark className="mb-6 h-16" />
        <h1 className="text-2xl font-bold">You&apos;ve logged out</h1>
        <p className="mt-3 max-w-xs text-sm text-pretty text-neutral-700">
          Come back anytime to report or follow live incidents.
        </p>
      </div>
      <Button
        className="mt-8 h-12 w-full text-base font-bold"
        size="lg"
        type="button"
        onClick={continueToLogin}
      >
        Continue
      </Button>
    </AuthShell>
  )
}

export { LogoutConfirmPage }
