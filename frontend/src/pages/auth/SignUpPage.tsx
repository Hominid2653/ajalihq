import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Camera } from "lucide-react"

import { AuthShell } from "@/components/brand/auth-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser, setSession } from "@/lib/auth"

function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setPending(true)
    try {
      const user = await createUser({ name, email, phone })
      setSession(user)
      navigate("/dashboard", { replace: true })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-9" asChild>
          <Link to="/" aria-label="Back">
            ←
          </Link>
        </Button>
        <h1 className="text-lg font-bold">Create account</h1>
      </div>

      <div className="mb-6 flex flex-col items-center text-center">
        <Avatar className="mb-3 size-20">
          <AvatarFallback className="bg-primary/15 text-primary">
            <Camera className="size-6" />
          </AvatarFallback>
        </Avatar>
        <p className="max-w-xs text-sm text-pretty text-neutral-700">
          Welcome! Let&apos;s set up your account. Upload your profile picture
          above.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            required
            autoComplete="name"
            placeholder="Full name"
            className="h-11 bg-white"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-email">Email address</Label>
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            className="h-11 bg-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+254 7xx xxx xxx"
            className="h-11 bg-white"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Password"
            className="h-11 bg-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm password"
            className="h-11 bg-white"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          className="h-12 w-full text-base font-bold"
          size="lg"
          type="submit"
          disabled={pending}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-700">
        Already have an account?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signin">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

export { SignUpPage }
