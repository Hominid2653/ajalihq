import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format, startOfDay, subDays } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { AdminPage, AdminShell } from "@/components/admin/admin-shell"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi } from "@/services/admin-api"
import { incidentApi } from "@/services/incident-api"
import type { DashboardStats, Incident } from "@/types/incident"
import {
  severityLabel,
  statusLabel,
  typeLabel,
  urgencyLabel,
} from "@/types/incident"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--status-pending)",
  VERIFIED: "var(--status-verified)",
  IN_PROGRESS: "var(--status-progress)",
  RESOLVED: "var(--status-resolved)",
  CLOSED: "var(--status-closed)",
}

const URGENCY_COLORS: Record<string, string> = {
  LOW: "var(--urgency-low)",
  MEDIUM: "var(--urgency-medium)",
  HIGH: "var(--urgency-high)",
  CRITICAL: "var(--urgency-critical)",
}

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: "var(--severity-minor)",
  MODERATE: "var(--severity-moderate)",
  MAJOR: "var(--severity-major)",
  CRITICAL: "var(--severity-critical)",
}

type AttentionRow = {
  key: string
  incidentId: string
  reference: string
  title: string
  reason: string
  tone: "critical" | "warn" | "neutral"
}

function AdminAnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([incidentApi.getAll(), adminApi.getDashboardStats()])
      .then(([list, dashboardStats]) => {
        setIncidents(list)
        setStats(dashboardStats)
      })
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false))
  }, [])

  const activity = useMemo(() => {
    const today = startOfDay(new Date())
    return Array.from({ length: 14 }, (_, index) => {
      const day = subDays(today, 13 - index)
      const key = format(day, "yyyy-MM-dd")
      const count = incidents.filter(
        (item) => format(startOfDay(new Date(item.createdAt)), "yyyy-MM-dd") === key
      ).length
      return { day: format(day, "MMM d"), full: format(day, "EEE d MMM"), count }
    })
  }, [incidents])

  const byStatus = useMemo(() => {
    const order = ["PENDING", "VERIFIED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const
    return order.map((status) => ({
      status: statusLabel(status),
      count: incidents.filter((i) => i.status === status && !i.archived).length,
      fill: STATUS_COLORS[status],
    }))
  }, [incidents])

  const byUrgency = useMemo(() => {
    const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const
    return order.map((urgency) => ({
      urgency,
      label: urgencyLabel(urgency),
      count: incidents.filter((i) => i.urgency === urgency && !i.archived).length,
      fill: URGENCY_COLORS[urgency],
    }))
  }, [incidents])

  const bySeverity = useMemo(() => {
    const order = ["CRITICAL", "MAJOR", "MODERATE", "MINOR"] as const
    return order.map((severity) => ({
      severity,
      label: severityLabel(severity),
      count: incidents.filter((i) => i.severity === severity && !i.archived).length,
      fill: SEVERITY_COLORS[severity],
    }))
  }, [incidents])

  const byType = useMemo(() => {
    const order = ["accident", "fire", "medical", "crime", "disaster"] as const
    return order.map((type) => ({
      type,
      label: typeLabel(type),
      count: incidents.filter((i) => i.type === type && !i.archived).length,
    }))
  }, [incidents])

  const attention = useMemo(() => {
    const rows: AttentionRow[] = []
    for (const item of incidents) {
      if (item.archived) continue
      if (item.status === "PENDING" && (item.urgency === "CRITICAL" || item.urgency === "HIGH")) {
        rows.push({
          key: `${item.id}-pending-urgent`,
          incidentId: item.id,
          reference: item.reference,
          title: item.title,
          reason: `Pending · ${urgencyLabel(item.urgency)} urgency`,
          tone: "critical",
        })
      } else if (item.status === "PENDING") {
        rows.push({
          key: `${item.id}-pending`,
          incidentId: item.id,
          reference: item.reference,
          title: item.title,
          reason: "Awaiting verification",
          tone: "warn",
        })
      } else if (item.status === "VERIFIED") {
        rows.push({
          key: `${item.id}-verified`,
          incidentId: item.id,
          reference: item.reference,
          title: item.title,
          reason: "Awaiting response start",
          tone: "warn",
        })
      }
      if (item.lat === null || item.lng === null) {
        rows.push({
          key: `${item.id}-loc`,
          incidentId: item.id,
          reference: item.reference,
          title: item.title,
          reason: "Missing map coordinates",
          tone: "neutral",
        })
      }
    }
    const rank = { critical: 0, warn: 1, neutral: 2 }
    return rows.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 8)
  }, [incidents])

  const missingCoords = useMemo(
    () => incidents.filter((i) => !i.archived && (i.lat === null || i.lng === null)).length,
    [incidents]
  )

  const kpi = useMemo(() => {
    if (!stats) return []
    return [
      { label: "Total", value: stats.total, to: "/admin/incidents" },
      { label: "Pending", value: stats.pending, to: "/admin/incidents?status=PENDING" },
      { label: "Awaiting response", value: stats.awaitingResponse, to: "/admin/incidents?status=VERIFIED" },
      { label: "In progress", value: stats.inProgress, to: "/admin/incidents?status=IN_PROGRESS" },
      { label: "Today", value: stats.today, to: "/admin/incidents" },
      { label: "Critical urgency", value: stats.criticalUrgency, to: "/admin/incidents?urgency=CRITICAL" },
      { label: "Handoff ack", value: stats.awaitingHandoffAck, to: "/admin/departments" },
      { label: "No coords", value: missingCoords, to: "/admin/incidents" },
    ]
  }, [stats, missingCoords])

  const activityConfig = {
    count: { label: "Reports", color: "var(--ajali-primary)" },
  } satisfies ChartConfig

  const statusConfig = Object.fromEntries(
    byStatus.map((row) => [row.status, { label: row.status, color: row.fill }])
  ) satisfies ChartConfig

  const urgencyConfig = Object.fromEntries(
    byUrgency.map((row) => [row.label, { label: row.label, color: row.fill }])
  ) satisfies ChartConfig

  const severityConfig = Object.fromEntries(
    bySeverity.map((row) => [row.label, { label: row.label, color: row.fill }])
  ) satisfies ChartConfig

  const typeConfig = {
    count: { label: "Count", color: "var(--ajali-primary)" },
  } satisfies ChartConfig

  return (
    <AdminShell
      title="Analytics"
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Analytics" },
      ]}
    >
      <AdminPage wide className="flex flex-col gap-6">
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
        ) : null}

        {/* KPI strip - from adminApi.getDashboardStats() */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {loading || !stats
            ? Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))
            : kpi.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-xl border bg-card px-3 py-3 shadow-[var(--shadow-card)] transition-colors hover:bg-muted/40"
                >
                  <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{item.value}</p>
                </Link>
              ))}
        </section>

        {/* Slim needs-attention list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Needs attention</CardTitle>
            <CardDescription>
              Pending review, awaiting response, and missing locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : attention.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Nothing needs attention right now.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((row) => (
                  <li key={row.key}>
                    <Link
                      to={`/admin/incidents/${row.incidentId}/review`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          row.tone === "critical" && "bg-[var(--urgency-critical)]",
                          row.tone === "warn" && "bg-[var(--urgency-high)]",
                          row.tone === "neutral" && "bg-muted-foreground"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {row.reference} · {row.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{row.reason}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Hero chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Incident activity</CardTitle>
            <CardDescription>Reports received over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="aspect-[21/9] w-full rounded-xl" />
            ) : (
              <ChartContainer config={activityConfig} className="aspect-[21/9] w-full min-h-[220px]">
                <LineChart data={activity} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          String(payload?.[0]?.payload?.full ?? "")
                        }
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--color-count)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>By status</CardTitle>
              <CardDescription>Lifecycle distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="mx-auto aspect-square max-h-64 w-full rounded-full" />
              ) : (
                <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-64">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                    <Pie
                      data={byStatus}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={55}
                      outerRadius={90}
                      strokeWidth={2}
                    >
                      {byStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By urgency</CardTitle>
              <CardDescription>How quickly reports need attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="aspect-video w-full rounded-xl" />
              ) : (
                <ChartContainer config={urgencyConfig} className="aspect-video w-full">
                  <BarChart data={byUrgency} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" radius={6}>
                      {byUrgency.map((entry) => (
                        <Cell key={entry.urgency} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By severity</CardTitle>
              <CardDescription>How serious the incident is</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="aspect-video w-full rounded-xl" />
              ) : (
                <ChartContainer config={severityConfig} className="aspect-video w-full">
                  <BarChart data={bySeverity} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" radius={6}>
                      {bySeverity.map((entry) => (
                        <Cell key={entry.severity} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By incident type</CardTitle>
              <CardDescription>Category mix</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="aspect-video w-full rounded-xl" />
              ) : (
                <ChartContainer config={typeConfig} className="aspect-video w-full">
                  <BarChart data={byType} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={72}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminPage>
    </AdminShell>
  )
}

export { AdminAnalyticsPage }
