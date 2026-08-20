import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  List,
  LogOut,
  Map,
  UserRound,
} from "lucide-react"

import { Logomark } from "@/components/brand/logomark"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/store/hooks"
import { cn } from "@/lib/utils"

const SIDEBAR_KEY = "ajali-sidebar-expanded"

const tabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports",   label: "Reports",   icon: List },
  { to: "/map",       label: "Map",        icon: Map },
  { to: "/account",   label: "Account",    icon: UserRound },
]

type UserShellProps = {
  title: ReactNode
  end?: ReactNode
  children: ReactNode
  /** Full-bleed map views: no extra scroll padding, header floats above content. */
  bleed?: boolean
}

/* ─── sidebar expand/collapse persisted to localStorage ─── */
function useSidebarExpanded() {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY)
      if (raw === "0") setExpanded(false)
      if (raw === "1") setExpanded(true)
    } catch {
      // storage blocked — ignore
    }
  }, [])

  function toggle() {
    setExpanded((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0") } catch {}
      return next
    })
  }

  return { expanded, toggle }
}

/* ─── a single sidebar nav item ─── */
function SidebarLink({
  to,
  label,
  icon: Icon,
  expanded,
}: {
  to: string
  label: string
  icon: React.ElementType
  expanded: boolean
}) {
  const link = (
    <NavLink
      to={to}
      aria-label={label}
      title={expanded ? undefined : label}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          expanded ? "justify-start" : "justify-center px-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary font-semibold"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      {expanded ? <span className="truncate">{label}</span> : null}
    </NavLink>
  )

  if (expanded) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function UserShell({ title, end, children, bleed = false }: UserShellProps) {
  const { expanded, toggle } = useSidebarExpanded()
  const { user: session } = useAuth()

  return (
    <div className="flex min-h-svh bg-background text-foreground">

      {/* ══ Desktop sidebar ══ */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
          expanded ? "w-60" : "w-[3.75rem]"
        )}
      >
        {/* Logo row */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            expanded ? "gap-2 px-3" : "justify-center px-0"
          )}
        >
          <Link
            to="/dashboard"
            className={cn(
              "flex min-w-0 items-center gap-2.5 overflow-hidden",
              expanded ? "flex-1" : "justify-center"
            )}
            aria-label="Ajali! dashboard"
          >
            <Logomark className="h-8 shrink-0" />
            {expanded ? (
              <span className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
                Ajali!
              </span>
            ) : null}
          </Link>

          {/* Collapse / expand toggle */}
          <button
            type="button"
            onClick={toggle}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronsLeft className="size-4" />
            ) : (
              <ChevronsRight className="size-4" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-0.5 py-2",
            expanded ? "px-2" : "px-1"
          )}
          aria-label="Main"
        >
          {tabs.map((tab) => (
            <SidebarLink key={tab.to} {...tab} expanded={expanded} />
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User / logout footer */}
        <div className={cn("flex flex-col gap-0.5 py-2", expanded ? "px-2" : "px-1")}>
          {expanded && session ? (
            <div className="mb-1 truncate px-3 py-1.5 text-xs text-sidebar-foreground/60">
              <p className="truncate font-semibold text-sidebar-foreground">
                {session.name}
              </p>
              <p className="truncate">{session.email}</p>
            </div>
          ) : null}

          {expanded ? (
            <Link
              to="/logout"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <LogOut className="size-[18px] shrink-0" />
              <span>Log out</span>
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/logout"
                  aria-label="Log out"
                  className="flex justify-center rounded-md px-2 py-2.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <LogOut className="size-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* ══ Main content column ══ */}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">

        {/* Mobile + desktop header */}
        <header
          className={cn(
            "flex h-[var(--header-height-mobile)] shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-6",
            bleed &&
              "md:absolute md:inset-x-0 md:top-0 md:z-10 md:h-auto md:border-b-0 md:bg-transparent md:px-5 md:pt-5 md:backdrop-blur-none"
          )}
        >
          {/* Mobile logomark */}
          <Logomark className="h-7 w-auto shrink-0 md:hidden" />

          {/* Page title — compact floating chip on bleed (map) views */}
          <h1
            className={cn(
              "min-w-0 flex-1 text-center text-base font-bold tracking-tight md:text-left",
              bleed &&
                "inline-flex w-fit max-w-full flex-none items-center gap-2 rounded-full bg-[var(--ajali-surface)] px-3.5 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] ring-1 ring-border md:flex-none"
            )}
          >
            {title}
          </h1>

          {/* End slot */}
          <div
            className={cn(
              "ml-auto flex items-center justify-end gap-2 text-sm font-semibold text-primary",
              bleed && "md:ml-auto"
            )}
          >
            {end ?? <span className="inline-block w-8 md:hidden" />}
          </div>
        </header>

        {/* Page content */}
        <main
          className={cn(
            "relative flex min-h-0 flex-1 flex-col bg-background",
            bleed
              ? "overflow-hidden pb-[var(--bottom-nav-height)] md:pb-0"
              : "overflow-y-auto pb-[calc(var(--bottom-nav-height)+1rem)] md:pb-8"
          )}
        >
          {children}
        </main>
      </div>

      {/* ══ Mobile bottom navigation ══ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-sidebar-border bg-[var(--ajali-nav)] text-sidebar-foreground/60 md:hidden"
        style={{ height: "var(--bottom-nav-height)" }}
        aria-label="Main"
      >
        <ul className="grid h-full grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.to} className="flex">
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "flex w-full flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold tracking-wide transition-colors",
                    isActive
                      ? "text-[var(--ajali-primary)]"
                      : "hover:text-sidebar-foreground"
                  )
                }
              >
                <tab.icon className="size-5" />
                <span className="truncate px-1">{tab.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export { UserShell }
