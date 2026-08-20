import { useEffect, useState, type ElementType, type ReactNode } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Ellipsis,
  LayoutDashboard,
  LogOut,
  Map,
  PlusCircle,
  ScrollText,
  Shield,
} from "lucide-react"
import { QuickCreateIncidentButton } from "@/components/admin/quick-create-incident"

import { Logomark } from "@/components/brand/logomark"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { notificationApi } from "@/services/notification-api"
import { useAuth } from "@/store/hooks"
import { cn } from "@/lib/utils"

const SIDEBAR_KEY = "ajali-admin-sidebar-expanded"

/** Full desktop sidebar navigation */
const tabs = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/admin/incidents", label: "Incidents", icon: ClipboardList },
  { to: "/admin/incidents/new", label: "Create", icon: PlusCircle },
  { to: "/admin/map", label: "Map", icon: Map },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/notifications", label: "Alerts", icon: Bell },
  { to: "/admin/audit-log", label: "Audit", icon: ScrollText },
]

/** Primary tabs shown in the mobile bottom bar */
const mobilePrimary = [
  { to: "/admin", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/admin/incidents", label: "Inbox", icon: ClipboardList },
  { to: "/admin/incidents/new", label: "Create", icon: PlusCircle },
  { to: "/admin/map", label: "Map", icon: Map },
]

const mobileMore = [
  { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/audit-log", label: "Audit log", icon: ScrollText },
]

type AdminShellProps = {
  title: ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  end?: ReactNode
  children: ReactNode
  bleed?: boolean
  /** Hide the breadcrumb row (e.g. Figma dashboard home) */
  hideBreadcrumbs?: boolean
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

function SidebarNavLink({
  to,
  label,
  icon: Icon,
  expanded,
  end,
  badge,
  onNavigate,
}: {
  to: string
  label: string
  icon: ElementType
  expanded: boolean
  end?: boolean
  badge?: number
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          expanded ? "justify-start" : "justify-center px-2",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      {expanded ? <span className="truncate">{label}</span> : null}
      {badge && badge > 0 ? (
        <span
          className={cn(
            "flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ajali-primary)] px-1 text-[10px] font-bold text-white",
            expanded ? "ml-auto" : "absolute top-1 right-1"
          )}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
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

function AdminShell({
  title,
  breadcrumbs,
  end,
  children,
  bleed = false,
  hideBreadcrumbs = false,
}: AdminShellProps) {
  const { expanded, toggle } = useSidebarExpanded()
  const { user } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    function refreshUnread() {
      notificationApi
        .getAll()
        .then((list) => setUnread(list.filter((n) => !n.read).length))
        .catch(() => setUnread(0))
    }
    refreshUnread()
    window.addEventListener("ajali:notifications-changed", refreshUnread)
    return () => window.removeEventListener("ajali:notifications-changed", refreshUnread)
  }, [location.pathname])

  const crumbs =
    breadcrumbs ??
    ([
      { label: "Admin", to: "/admin" },
      { label: typeof title === "string" ? title : "Page" },
    ] as { label: string; to?: string }[])

  const moreActive = mobileMore.some(
    (t) =>
      location.pathname === t.to || location.pathname.startsWith(`${t.to}/`)
  )

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* ══ Desktop / laptop sidebar (md+) ══ */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
          expanded ? "w-52 lg:w-60 xl:w-64 2xl:w-72" : "w-[3.75rem]"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            expanded ? "gap-2 px-3" : "justify-center"
          )}
        >
          <Link
            to="/admin"
            className={cn(
              "flex min-w-0 items-center gap-2.5 overflow-hidden",
              expanded ? "flex-1" : "justify-center"
            )}
          >
            <Shield className="size-7 shrink-0 text-[var(--ajali-primary)]" />
            {expanded ? (
              <span className="truncate text-base font-bold">Admin</span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
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
            "flex flex-1 flex-col gap-0.5 overflow-y-auto py-2",
            expanded ? "px-2" : "px-1"
          )}
          aria-label="Admin"
        >
          {tabs.map((tab) => (
            <SidebarNavLink
              key={tab.to}
              {...tab}
              expanded={expanded}
              badge={tab.to === "/admin/notifications" ? unread : undefined}
            />
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />
        <div
          className={cn("flex flex-col gap-1 py-2", expanded ? "px-2" : "px-1")}
        >
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
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
              !expanded && "justify-center px-2"
            )}
            title={!expanded ? "Citizen app" : undefined}
          >
            <Logomark className="h-5 shrink-0" />
            {expanded ? <span>Citizen app</span> : null}
          </Link>
          <Link
            to="/logout"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
              !expanded && "justify-center px-2"
            )}
            title={!expanded ? "Log out" : undefined}
          >
            <LogOut className="size-[18px]" />
            {expanded ? <span>Log out</span> : null}
          </Link>
        </div>
      </aside>

      {/* ══ Main column ══ */}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "flex h-[var(--header-height-mobile)] shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:gap-3 sm:px-4 md:h-14 md:px-6 xl:px-8",
            bleed &&
              "md:absolute md:inset-x-0 md:top-0 md:z-10 md:h-auto md:border-b-0 md:bg-transparent md:px-5 md:pt-4 md:backdrop-blur-none xl:px-8"
          )}
        >
          <Shield className="size-6 shrink-0 text-[var(--ajali-primary)] md:hidden" />

          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                "truncate text-center text-base font-bold tracking-tight md:text-left",
                bleed &&
                  "inline-flex max-w-full items-center rounded-full bg-[var(--ajali-surface)] px-3.5 py-1.5 text-sm shadow-[var(--shadow-card)] ring-1 ring-border"
              )}
            >
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <QuickCreateIncidentButton />
            <div className="hidden items-center gap-2 lg:flex">{end}</div>
            <Button
              variant="outline"
              size="icon"
              className="relative size-9 md:size-10"
              asChild
            >
              <Link to="/admin/notifications" aria-label="Notifications">
                <Bell className="size-4" />
                {unread > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ajali-primary)] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
            </Button>
          </div>
        </header>

        {/* Breadcrumb sits below the navbar */}
        {!bleed && !hideBreadcrumbs ? (
          <div className="hidden border-b border-border bg-background px-3 py-2 sm:px-4 md:block md:px-6 xl:px-8">
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="contents">
                    {i > 0 ? <BreadcrumbSeparator /> : null}
                    <BreadcrumbItem>
                      {c.to && i < crumbs.length - 1 ? (
                        <BreadcrumbLink asChild>
                          <Link to={c.to}>{c.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{c.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ) : null}

        {/* Mobile / tablet actions under header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:hidden">
          <QuickCreateIncidentButton />
          {end ? <div className="flex items-center gap-2">{end}</div> : null}
        </div>
        {end ? (
          <div className="hidden items-center justify-end gap-2 border-b border-border px-3 py-2 sm:flex lg:hidden">
            {end}
          </div>
        ) : null}

        <main
          className={cn(
            "relative flex min-h-0 flex-1 flex-col bg-background",
            bleed
              ? "overflow-hidden pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] md:pb-0"
              : "overflow-y-auto pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] md:pb-8"
          )}
        >
          {children}
        </main>
      </div>

      {/* ══ Mobile bottom bar ══ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-sidebar-border bg-[var(--ajali-nav)] pb-[env(safe-area-inset-bottom,0px)] text-sidebar-foreground/60 md:hidden"
        style={{
          height:
            "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
        }}
        aria-label="Admin"
      >
        <ul className="grid h-full grid-cols-5">
          {mobilePrimary.map((tab) => (
            <li key={tab.to} className="flex">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold tracking-wide transition-colors",
                    isActive
                      ? "text-[var(--ajali-primary)]"
                      : "hover:text-sidebar-foreground"
                  )
                }
              >
                <tab.icon className="size-5" />
                <span className="truncate">{tab.label}</span>
              </NavLink>
            </li>
          ))}
          <li className="flex">
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold tracking-wide transition-colors",
                    moreActive
                      ? "text-[var(--ajali-primary)]"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  )}
                  aria-label="More"
                >
                  <span className="relative">
                    <Ellipsis className="size-5" />
                    {unread > 0 ? (
                      <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[var(--ajali-primary)]" />
                    ) : null}
                  </span>
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-2xl bg-background pb-8"
              >
                <SheetHeader>
                  <SheetTitle>Admin menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-1 px-1">
                  {mobileMore.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                    >
                      <item.icon className="size-5 text-primary" />
                      <span className="flex-1">{item.label}</span>
                      {item.to === "/admin/notifications" && unread > 0 ? (
                        <span className="rounded-full bg-[var(--ajali-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                  <Separator className="my-2" />
                  <Link
                    to="/dashboard"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                  >
                    <Logomark className="h-5" />
                    Citizen app
                  </Link>
                  <Link
                    to="/logout"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-muted"
                  >
                    <LogOut className="size-5" />
                    Log out
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </div>
  )
}

/** Responsive page width: phone → laptop → large monitor */
export function AdminPage({
  children,
  className,
  wide = false,
}: {
  children: ReactNode
  className?: string
  /** Wider canvas for tables / dashboards on large monitors */
  wide?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 xl:px-10 2xl:px-12",
        wide
          ? "max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem]"
          : "max-w-3xl md:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  )
}

export { AdminShell }
