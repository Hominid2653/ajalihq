import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { LayoutDashboard, List, Map, UserRound } from "lucide-react"

import { Logomark } from "@/components/brand/logomark"
import { brandStyle } from "@/lib/brand"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Report List", icon: List },
  { to: "/map", label: "Report Map", icon: Map },
  { to: "/account", label: "Account", icon: UserRound },
]

type UserShellProps = {
  title: string
  end?: ReactNode
  children: ReactNode
}

function UserShell({ title, end, children }: UserShellProps) {
  return (
    <div
      className="min-h-svh bg-neutral-200 text-neutral-900"
      style={brandStyle}
    >
      <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-white">
        <header className="grid h-14 shrink-0 grid-cols-[4.5rem_1fr_4.5rem] items-center border-b border-neutral-100 px-4">
          <Logomark className="h-8 w-auto justify-self-start" />
          <h1 className="text-center text-base font-bold">{title}</h1>
          <div className="justify-self-end text-sm font-semibold text-primary">
            {end ?? <span className="inline-block w-10" />}
          </div>
        </header>
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pb-28">
          {children}
        </main>
        <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 bg-neutral-950 text-neutral-400">
          <ul className="grid grid-cols-4">
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 py-3 text-[11px] font-semibold",
                      isActive && "text-primary"
                    )
                  }
                >
                  <tab.icon className="size-5" />
                  {tab.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export { UserShell }
