import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthShell } from "@/components/brand/auth-shell"
import { Logomark } from "@/components/brand/logomark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setPendingEmail } from "@/lib/auth"

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPendingEmail(email.trim())
    navigate("/signin/confirm")
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <Logomark className="mb-6 h-16" />
        <p className="max-w-xs text-sm font-semibold text-pretty text-neutral-700">
          Enter your email and we&apos;ll send a password reset link.
        </p>
      </div>

      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2 text-left">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email"
            className="h-11 bg-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button className="h-12 w-full text-base font-bold" size="lg" type="submit">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-700">
        Remembered it?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signin">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export { ForgotPasswordPage }
