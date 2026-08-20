import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { BadgeCheck, Camera, Check, Pencil } from "lucide-react"
import { toast } from "sonner"

import { UserShell } from "@/components/user/user-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { applyProfile, updateUserProfile } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { toDurableMediaUrl } from "@/services/media-api"
import { useAppDispatch, useAuth } from "@/store/hooks"
import {
  isAccountVerified,
  isProfileComplete,
  isValidIdNumber,
  type PreferredContactMethod,
} from "@/types/auth"

type ProfileFormState = {
  name: string
  phone: string
  location: string
  bio: string
  preferredContactMethod: PreferredContactMethod
  avatarUrl: string
  idNumber: string
}

function maskIdNumber(idNumber: string) {
  if (idNumber.length <= 4) return idNumber
  return `••••${idNumber.slice(-4)}`
}

function AccountPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user: session } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileFormState | null>(null)

  useEffect(() => {
    if (!session) return
    setForm({
      name: session.name,
      phone: session.phone ?? "",
      location: session.location ?? "",
      bio: session.bio ?? "",
      preferredContactMethod: session.preferredContactMethod ?? "PHONE",
      avatarUrl: session.avatarUrl ?? "",
      idNumber: session.idNumber ?? "",
    })
    if (!isProfileComplete(session)) setEditing(true)
  }, [session])

  if (!session || !form) return null

  const initials = session.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const verified = isAccountVerified(session)
  const complete = isProfileComplete(session)

  function setField<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.")
      return
    }
    try {
      const url = await toDurableMediaUrl(file)
      setField("avatarUrl", url)
      if (!editing) setEditing(true)
      toast.success("Photo ready. Save profile to keep it.")
    } catch {
      toast.error("Could not process that image.")
    } finally {
      event.target.value = ""
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!session || !form) return
    setError(null)

    if (!form.name.trim()) {
      setError("Full name is required.")
      return
    }
    if (!form.phone.trim()) {
      setError("Phone number is required for emergency contact.")
      return
    }
    if (form.idNumber.trim() && !isValidIdNumber(form.idNumber)) {
      setError("ID number must be 7 or 8 digits.")
      return
    }

    setSaving(true)
    try {
      const updated = await updateUserProfile(session.id, {
        name: form.name,
        phone: form.phone,
        location: form.location,
        bio: form.bio,
        preferredContactMethod: form.preferredContactMethod,
        avatarUrl: form.avatarUrl,
        idNumber: form.idNumber.trim(),
      })
      applyProfile(dispatch, updated)
      setEditing(false)
      toast.success(
        isAccountVerified(updated)
          ? "Profile saved. Account verified."
          : "Profile saved."
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.")
    } finally {
      setSaving(false)
    }
  }

  function onCancel() {
    if (!session) return
    setForm({
      name: session.name,
      phone: session.phone ?? "",
      location: session.location ?? "",
      bio: session.bio ?? "",
      preferredContactMethod: session.preferredContactMethod ?? "PHONE",
      avatarUrl: session.avatarUrl ?? "",
      idNumber: session.idNumber ?? "",
    })
    setError(null)
    setEditing(false)
  }

  return (
    <UserShell title="Account">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6 md:max-w-2xl md:px-8">
        {!complete ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            Finish your profile so responders can reach you during an emergency.
          </div>
        ) : null}
        {!verified ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            Add your national ID number to verify your account.
          </div>
        ) : null}

        <Card className="bg-[var(--ajali-cream)]">
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative shrink-0"
              aria-label="Change profile photo"
            >
              <Avatar className="size-16 ring-2 ring-background md:size-20">
                {form.avatarUrl || session.avatarUrl ? (
                  <AvatarImage
                    src={form.avatarUrl || session.avatarUrl}
                    alt=""
                  />
                ) : null}
                <AvatarFallback className="bg-[var(--ajali-primary)] text-lg font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="truncate text-base md:text-lg">
                  {session.name}
                </CardTitle>
                {verified ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-[var(--status-resolved)]/30 bg-[var(--status-resolved)]/15 text-[var(--status-resolved)]"
                  >
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
              <CardDescription className="truncate">{session.email}</CardDescription>
              <p className="mt-1 text-xs text-muted-foreground">
                {complete ? (
                  <span className="inline-flex items-center gap-1 text-[var(--ajali-primary)]">
                    <Check className="size-3.5" /> Profile complete
                  </span>
                ) : (
                  "Profile incomplete"
                )}
              </p>
            </div>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 font-semibold"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            ) : null}
          </CardHeader>
          <Separator />
          <CardContent className="space-y-1 py-3 text-sm">
            <p>
              <span className="text-muted-foreground">Role:</span>{" "}
              <span className="font-semibold">{session.role}</span>
            </p>
            {!editing ? (
              <>
                <p>
                  <span className="text-muted-foreground">ID number:</span>{" "}
                  <span className="font-medium">
                    {session.idNumber
                      ? maskIdNumber(session.idNumber)
                      : "Not set"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <span className="font-medium">{session.phone || "-"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Location:</span>{" "}
                  <span className="font-medium">{session.location || "-"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Preferred contact:</span>{" "}
                  <span className="font-medium">
                    {session.preferredContactMethod || "PHONE"}
                  </span>
                </p>
                {session.bio ? (
                  <p className="pt-1 text-muted-foreground">{session.bio}</p>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        {editing ? (
          <form
            onSubmit={onSave}
            className={cn(
              "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] md:p-6"
            )}
          >
            <div>
              <h2 className="text-base font-bold">
                {complete ? "Edit profile" : "Set up your profile"}
              </h2>
              <p className="text-sm text-muted-foreground">
                These details help responders contact you about your reports.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  className="h-11 bg-[var(--ajali-surface)]"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  className="h-11 bg-muted"
                  value={session.email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email is used to sign in and cannot be changed here.
                </p>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="profile-id">National ID number</Label>
                <Input
                  id="profile-id"
                  inputMode="numeric"
                  className="h-11 bg-[var(--ajali-surface)]"
                  placeholder="7 or 8 digit ID"
                  value={form.idNumber}
                  onChange={(e) => setField("idNumber", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Adding a valid ID number marks your account as verified.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  className="h-11 bg-[var(--ajali-surface)]"
                  placeholder="+254 7xx xxx xxx"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="profile-location">City / area</Label>
                <Input
                  id="profile-location"
                  className="h-11 bg-[var(--ajali-surface)]"
                  placeholder="e.g. Nairobi, Westlands"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="profile-contact">Preferred contact</Label>
                <Select
                  value={form.preferredContactMethod}
                  onValueChange={(value) =>
                    setField(
                      "preferredContactMethod",
                      value as PreferredContactMethod
                    )
                  }
                >
                  <SelectTrigger
                    id="profile-contact"
                    className="h-11 w-full bg-[var(--ajali-surface)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE">Phone</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="profile-bio">About you</Label>
                <Textarea
                  id="profile-bio"
                  className="min-h-24 bg-[var(--ajali-surface)]"
                  placeholder="Optional note for responders"
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-11 font-semibold" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
              {complete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 font-semibold"
                  onClick={onCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        <Button
          className="h-11 font-semibold"
          variant="destructive"
          onClick={() => navigate("/logout")}
        >
          Log out
        </Button>
      </div>
    </UserShell>
  )
}

export { AccountPage }
