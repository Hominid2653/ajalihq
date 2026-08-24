import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"

import { AdminShell, adminDesktopRailClass } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { notificationApi } from "@/services/notification-api"
import type {
  AppNotification,
  NotificationChannel,
  NotificationEventType,
} from "@/types/incident"

const CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "SMS"]
const EVENT_TYPES: NotificationEventType[] = [
  "REPORT_RECEIVED",
  "CRITICAL_REPORT_RECEIVED",
  "REPORT_VERIFIED",
  "REPORT_CLOSED",
  "RESPONSE_STARTED",
  "DEPARTMENT_ASSIGNED",
  "INCIDENT_RESOLVED",
  "INCIDENT_ARCHIVED",
  "CITIZEN_STATUS_NOTIFY",
  "CRITICAL_INCIDENT",
  "STATUS_IN_PROGRESS",
]

function notifyShellBadgeRefresh() {
  window.dispatchEvent(new CustomEvent("ajali:notifications-changed"))
}

function AdminNotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [channel, setChannel] = useState("all")
  const [type, setType] = useState("all")
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    notificationApi
      .getAll()
      .then(setItems)
      .catch(() => setError("Could not load notifications."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesChannel = channel === "all" || item.channel === channel
        const matchesType = type === "all" || item.type === type
        return matchesChannel && matchesType
      }),
    [channel, items, type]
  )

  const unreadCount = items.filter((item) => !item.read).length

  async function markRead(id: string) {
    try {
      const updated = await notificationApi.markAsRead(id)
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
      notifyShellBadgeRefresh()
    } catch {
      toast.error("Could not mark notification as read.")
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await notificationApi.markAllAsRead()
      setItems((current) => current.map((item) => ({ ...item, read: true })))
      notifyShellBadgeRefresh()
      toast.success("All notifications marked as read.")
    } catch {
      toast.error("Could not mark all as read.")
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <AdminShell
      title="Notifications"
      flush
      end={
        unreadCount > 0 ? (
          <Button size="sm" variant="outline" disabled={markingAll} onClick={() => void markAllRead()}>
            {markingAll ? "Updating…" : "Mark all read"}
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 md:min-w-0 md:overflow-y-auto md:px-6 md:py-6">
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</p>
        ) : null}

        <div className="flex flex-col gap-2 md:hidden">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger>
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {CHANNELS.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {EVENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading
          ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-28" />)
          : null}
        {!loading && !error && filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notifications match these filters.
            </CardContent>
          </Card>
        ) : null}
        {filtered.map((item) => (
          <Card
            key={item.id}
            className={item.read ? "" : "border-[var(--ajali-primary)] bg-[var(--ajali-cream)]"}
          >
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge variant="outline">{item.channel}</Badge>
                  <Badge variant="secondary">{String(item.type).replaceAll("_", " ")}</Badge>
                  {!item.read ? <Badge>New</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(item.createdAt), "d MMM yyyy, h:mm a")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.incidentId ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/incidents/${item.incidentId}`}>View incident</Link>
                  </Button>
                ) : null}
                {!item.read ? (
                  <Button size="sm" onClick={() => void markRead(item.id)}>
                    Mark read
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        <aside className={adminDesktopRailClass}>
          <div>
            <p className="text-sm text-muted-foreground">Alerts</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Notifications</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              In-app, email, and SMS events generated by the incident service.
            </p>
          </div>
          <dl className="space-y-2 border-t border-border pt-5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Unread</dt>
              <dd className="font-semibold tabular-nums">{unreadCount}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Showing</dt>
              <dd className="font-semibold tabular-nums">{filtered.length}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {CHANNELS.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {EVENT_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unreadCount > 0 ? (
              <Button
                className="mt-1"
                size="sm"
                variant="outline"
                disabled={markingAll}
                onClick={() => void markAllRead()}
              >
                {markingAll ? "Updating…" : "Mark all read"}
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </AdminShell>
  )
}

export { AdminNotificationsPage }
