import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Camera } from "lucide-react"

import { AuthShell } from "@/components/brand/auth-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser, signIn } from "@/lib/auth"
import { defaultHomeForRole } from "@/lib/rbac"
import { toDurableMediaUrl } from "@/services/media-api"
import { useAppDispatch } from "@/store/hooks"
import { isProfileComplete, isValidIdNumber } from "@/types/auth"

function SignUpPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }
    try {
      const url = await toDurableMediaUrl(file)
      setAvatarUrl(url)
      setError(null)
    } catch {
      setError("Could not process that image.")
    } finally {
      event.target.value = ""
    }
  }

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
    if (idNumber.trim() && !isValidIdNumber(idNumber)) {
      setError("ID number must be 7 or 8 digits.")
      return
    }

    setPending(true)
    try {
      const user = await registerUser({
        name,
        email,
        password,
        phone,
        avatarUrl: avatarUrl || undefined,
        idNumber: idNumber.trim() || undefined,
      })
      signIn(dispatch, user)
      navigate(
        isProfileComplete(user) ? defaultHomeForRole(user.role) : "/account",
        { replace: true }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.")
    } finally {
      setPending(false)
    }
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

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
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative mb-3"
          aria-label="Upload profile picture"
        >
          <Avatar className="size-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/15 text-primary">
              {initials || <Camera className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5 text-white" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarChange}
        />
        <p className="max-w-xs text-sm text-pretty text-neutral-700">
          Welcome! Set up your account. Tap the circle to add a profile picture.
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
          <Label htmlFor="id-number">National ID number (optional)</Label>
          <Input
            id="id-number"
            inputMode="numeric"
            autoComplete="off"
            placeholder="7 or 8 digit ID"
            className="h-11 bg-white"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Adding a valid ID number verifies your account.
          </p>
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
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-700">
        Already have an account?{" "}
        <Link className="font-bold text-primary hover:underline" to="/signin">
          Log in
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-neutral-700">
        <Link className="font-bold text-primary hover:underline" to="/home">
          Home
        </Link>
      </p>
    </AuthShell>
  )
}

export { SignUpPage }
