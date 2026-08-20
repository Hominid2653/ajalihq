import { Link, useNavigate } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { authenticate, getPendingEmail, signIn } from "@/lib/auth"
import { defaultHomeForRole } from "@/lib/rbac"
import { useAppDispatch } from "@/store/hooks"

function SignInConfirmPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const email = getPendingEmail()

  async function continueToApp() {
    if (!email) {
      navigate("/signin", { replace: true })
      return
    }

    const user = await authenticate(email)
    if (!user) {
      navigate("/signin", { replace: true })
      return
    }

    signIn(dispatch, user)
    navigate(defaultHomeForRole(user.role), { replace: true })
  }

  return (
    <AuthShell>
      <div className="relative flex flex-col items-center text-center">
        <Link
          aria-label="Close"
          className="absolute top-0 right-0 text-xl leading-none text-neutral-700 hover:text-foreground"
          to="/signin"
        >
          ×
        </Link>
        <Logomark className="mb-6 h-16" />
        <h1 className="text-2xl font-bold">Check your inbox!</h1>
        <p className="mt-3 max-w-xs text-sm text-pretty text-neutral-700">
          We sent a login link
          {email ? (
            <>
              {" "}
              to <span className="font-semibold text-foreground">{email}</span>
            </>
          ) : null}
          . Open it to finish signing in.
        </p>
      </div>

      <Button
        className="mt-8 h-12 w-full text-base font-bold"
        size="lg"
        type="button"
        onClick={() => void continueToApp()}
      >
        Continue
      </Button>

      <p className="mt-4 text-center text-sm text-neutral-700">
        Not yours?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signin">
          Use a different email
        </Link>
      </p>
    </AuthShell>
  )
}

export { SignInConfirmPage }
