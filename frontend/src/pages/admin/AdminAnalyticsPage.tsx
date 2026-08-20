import { useEffect, useMemo, useState } from "react"
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
import { incidentApi } from "@/services/incident-api"
import type { Incident } from "@/types/incident"
import {
  severityLabel,
  statusLabel,
  typeLabel,
  urgencyLabel,
} from "@/types/incident"

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

function AdminAnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    incidentApi
      .getAll()
      .then(setIncidents)
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
      status,
      label: statusLabel(status),
      count: incidents.filter((item) => item.status === status).length,
      fill: STATUS_COLORS[status],
    }))
  }, [incidents])

  const byUrgency = useMemo(() => {
    const order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
    return order.map((urgency) => ({
      urgency,
      label: urgencyLabel(urgency),
      count: incidents.filter((item) => item.urgency === urgency).length,
      fill: URGENCY_COLORS[urgency],
    }))
  }, [incidents])

  const bySeverity = useMemo(() => {
    const order = ["MINOR", "MODERATE", "MAJOR", "CRITICAL"] as const
    return order.map((severity) => ({
      severity,
      label: severityLabel(severity),
      count: incidents.filter((item) => item.severity === severity).length,
      fill: SEVERITY_COLORS[severity],
    }))
  }, [incidents])

  const byType = useMemo(() => {
    const types = ["accident", "fire", "medical", "crime", "disaster"] as const
    return types.map((type) => ({
      type,
      label: typeLabel(type),
      count: incidents.filter((item) => item.type === type).length,
    }))
  }, [incidents])

  const activityConfig = {
    count: { label: "Reports", color: "var(--ajali-primary)" },
  } satisfies ChartConfig

  const statusConfig = Object.fromEntries(
    byStatus.map((item) => [item.status, { label: item.label, color: item.fill }])
  ) satisfies ChartConfig

  const urgencyConfig = Object.fromEntries(
    byUrgency.map((item) => [item.urgency, { label: item.label, color: item.fill }])
  ) satisfies ChartConfig

  const severityConfig = Object.fromEntries(
    bySeverity.map((item) => [item.severity, { label: item.label, color: item.fill }])
  ) satisfies ChartConfig

  const typeConfig = {
    count: { label: "Incidents", color: "var(--ajali-primary)" },
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
