import { Link, useNavigate } from "react-router-dom"

import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth"

function AccountPage() {
  const navigate = useNavigate()
  const session = getSession()

  if (!session) return null

  const initials = session.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <UserShell title="Account">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 md:px-8">
        {/* Profile card */}
        <Card className="bg-[var(--ajali-cream)]">
          <CardHeader className="flex-row items-center gap-4">
            {/* Avatar */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--ajali-primary)] text-lg font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{session.name}</CardTitle>
              <CardDescription className="truncate">{session.email}</CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-3 text-xs text-muted-foreground capitalize">
            Role: <span className="font-semibold text-foreground">{session.role}</span>
          </CardContent>
        </Card>

        {/* Actions */}
        <Button variant="outline" className="h-11 font-semibold" asChild>
          <Link to="/coming-soon">Edit profile</Link>
        </Button>

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
