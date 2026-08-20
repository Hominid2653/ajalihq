import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { authenticate, setPendingEmail, signIn } from "@/lib/auth"
import { defaultHomeForRole } from "@/lib/rbac"
import { useAppDispatch } from "@/store/hooks"

function SignInPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState("amina@ajalihq.test")
  const [password, setPassword] = useState("password")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (!password.trim()) {
        setError("Enter your password.")
        return
      }
      const user = await authenticate(email, password)
      if (!user) {
        setError("No account found for that email.")
        return
      }
      signIn(dispatch, user)
      const target = from ?? defaultHomeForRole(user.role)
      navigate(target, { replace: true })
    } finally {
      setPending(false)
    }
  }

  async function sendLoginLink() {
    setError(null)
    if (!email.trim()) {
      setError("Enter your email to receive a login link.")
      return
    }
    const user = await authenticate(email)
    if (!user) {
      setError("No account found for that email.")
      return
    }
    setPendingEmail(email.trim())
    navigate("/signin/confirm")
  }

  return (
    <AuthShell>
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <Logomark className="h-16" />
        <p className="max-w-xs text-sm font-medium text-muted-foreground">
          Enter your email and we&apos;ll send you a login link.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Demo: <span className="font-medium">amina@ajalihq.test</span> (USER) ·{" "}
          <span className="font-medium">brian@ajalihq.test</span> (ADMIN)
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 bg-[var(--ajali-surface)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs font-semibold text-primary hover:underline"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 bg-[var(--ajali-surface)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          className="h-11 w-full text-sm font-bold"
          type="submit"
          disabled={pending}
        >
          Sign in
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          variant="outline"
          className="h-11 w-full border-border bg-[var(--ajali-surface)] text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          type="button"
          disabled={pending}
          onClick={() => void sendLoginLink()}
        >
          Send login link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signup">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}

export { SignInPage }
