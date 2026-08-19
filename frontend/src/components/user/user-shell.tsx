import type { ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  List,
  LogOut,
  Map,
  UserRound,
} from "lucide-react"

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
  /** Full-bleed map views: no extra scroll padding, hide desktop header. */
  bleed?: boolean
}

function UserShell({ title, end, children, bleed = false }: UserShellProps) {
  return (
    <div
      className="flex min-h-svh bg-white text-neutral-900"
      style={brandStyle}
    >
      <aside className="hidden w-[4.25rem] shrink-0 flex-col items-center bg-neutral-950 py-5 text-neutral-400 md:flex">
        <Link to="/dashboard" aria-label="Ajali! dashboard" className="mb-8">
          <Logomark className="h-8" />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              title={tab.label}
              aria-label={tab.label}
              className={({ isActive }) =>
                cn(
                  "flex size-11 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-white/10 text-primary"
                    : "hover:bg-white/5 hover:text-white"
                )
              }
            >
              <tab.icon className="size-5" />
            </NavLink>
          ))}
        </nav>
        <Link
          to="/logout"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold hover:text-white"
        >
          Sign in
          <LogOut className="size-5" />
        </Link>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "grid h-14 shrink-0 grid-cols-[4.5rem_1fr_4.5rem] items-center border-b border-neutral-100 px-4 md:grid-cols-[1fr_auto] md:px-6",
            bleed && "md:hidden"
          )}
        >
          <Logomark className="h-8 w-auto justify-self-start md:hidden" />
          <h1 className="text-center text-base font-bold md:text-left">
            {title}
          </h1>
          <div className="justify-self-end text-sm font-semibold text-primary">
            {end ?? <span className="inline-block w-10 md:hidden" />}
          </div>
        </header>

        <main
          className={cn(
            "relative flex min-h-0 flex-1 flex-col",
            bleed
              ? "overflow-hidden pb-16 md:pb-0"
              : "overflow-y-auto pb-28 md:pb-8"
          )}
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 bg-neutral-950 text-neutral-400 md:hidden"
        aria-label="Main"
      >
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
  )
}

export { UserShell }
