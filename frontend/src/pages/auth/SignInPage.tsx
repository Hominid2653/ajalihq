import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { findUserByEmail, setPendingEmail, setSession } from "@/lib/auth"

function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

      const user = await findUserByEmail(email)
      if (!user) {
        setError("No account found for that email.")
        return
      }

      setSession(user)
      navigate(from, { replace: true })
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

    const user = await findUserByEmail(email)
    if (!user) {
      setError("No account found for that email.")
      return
    }

    setPendingEmail(email.trim())
    navigate("/signin/confirm")
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <Logomark className="mb-6 h-16" />
        <p className="max-w-xs text-sm font-semibold text-pretty text-black">
          Enter your email and we&apos;ll send you a login link.
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2 text-left">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email"
            className="h-11 bg-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-2 text-left">
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
            placeholder="Password"
            className="h-11 bg-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          className="h-12 w-full text-base font-bold"
          size="lg"
          type="submit"
          disabled={pending}
        >
          Sign in
        </Button>
        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-neutral-400 bg-white text-base font-bold text-black transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:pointer-events-none disabled:opacity-50"
          type="button"
          disabled={pending}
          onClick={() => void sendLoginLink()}
        >
          Send login link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-700">
        Don&apos;t have an account?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signup">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}

export { SignInPage }
