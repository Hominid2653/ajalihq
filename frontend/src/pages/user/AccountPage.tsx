import { Link, useNavigate } from "react-router-dom"

import { UserShell } from "@/components/user/user-shell"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth"

function AccountPage() {
  const navigate = useNavigate()
  const session = getSession()

  if (!session) return null

  return (
    <UserShell title="Account">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 md:px-6">
        <div className="rounded-xl bg-[#f2efe8] px-4 py-4">
          <p className="text-lg font-bold">{session.name}</p>
          <p className="text-sm text-neutral-500">{session.email}</p>
          <p className="mt-1 text-sm text-neutral-500">{session.role}</p>
        </div>
        <Button variant="outline" className="h-11 font-bold" asChild>
          <Link to="/coming-soon">Edit profile</Link>
        </Button>
        <Button
          className="h-11 font-bold"
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
