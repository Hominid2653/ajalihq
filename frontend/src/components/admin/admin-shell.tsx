import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink } from "react-router-dom"
import {
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react"

import { Logomark } from "@/components/brand/logomark"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/store/hooks"
import { cn } from "@/lib/utils"

const SIDEBAR_KEY = "ajali-admin-sidebar-expanded"

const tabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/incidents", label: "Incident queue", icon: ClipboardList },
]

type AdminShellProps = {
  title: ReactNode
  end?: ReactNode
  children: ReactNode
}

function useSidebarExpanded() {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY)
      if (raw === "0") setExpanded(false)
      if (raw === "1") setExpanded(true)
    } catch {
      // ignore
    }
  }, [])

  function toggle() {
    setExpanded((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  return { expanded, toggle }
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  expanded,
  end,
}: {
  to: string
  label: string
  icon: React.ElementType
  expanded: boolean
  end?: boolean
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
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

function AdminShell({ title, end, children }: AdminShellProps) {
  const { expanded, toggle } = useSidebarExpanded()
  const { user } = useAuth()

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
          expanded ? "w-60" : "w-[3.75rem]"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            expanded ? "gap-2 px-3" : "justify-center px-0"
          )}
        >
          <Link
            to="/admin"
            className={cn(
              "flex min-w-0 items-center gap-2.5 overflow-hidden",
              expanded ? "flex-1" : "justify-center"
            )}
            aria-label="Ajali admin"
          >
            <Shield className="size-7 shrink-0 text-[var(--ajali-primary)]" />
            {expanded ? (
              <span className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
                Admin
              </span>
            ) : null}
          </Link>
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

        <nav
          className={cn(
            "flex flex-1 flex-col gap-0.5 py-2",
            expanded ? "px-2" : "px-1"
          )}
          aria-label="Admin"
        >
          {tabs.map((tab) => (
            <SidebarLink key={tab.to} {...tab} expanded={expanded} />
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className={cn("flex flex-col gap-2 py-2", expanded ? "px-2" : "px-1")}>
          {expanded && user ? (
            <div className="mb-1 truncate px-3 py-1.5 text-xs text-sidebar-foreground/60">
              <p className="truncate font-semibold text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate">{user.email}</p>
            </div>
          ) : null}
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              expanded ? "justify-start" : "justify-center px-2"
            )}
          >
            <Logomark className="h-5 shrink-0" />
            {expanded ? <span>Citizen app</span> : null}
          </Link>
          <Link
            to="/logout"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              expanded ? "justify-start" : "justify-center px-2"
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {expanded ? <span>Log out</span> : null}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="flex h-[var(--header-height-mobile)] shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-6">
          <Shield className="size-6 shrink-0 text-[var(--ajali-primary)] md:hidden" />
          <h1 className="min-w-0 flex-1 text-center text-base font-bold tracking-tight md:text-left">
            {title}
          </h1>
          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-primary">
            {end}
          </div>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export { AdminShell }
