import { useState, useEffect } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import { AdminShell, AdminPage } from "@/components/admin/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { readToken } from "@/lib/auth-storage"
import { env } from "@/lib/env"
import { buildUrl } from "@/lib/http-client"

type ProbeStatus = "pending" | "running" | "success" | "failure"

type ProbeResult = {
  id: string
  name: string
  endpoint: string
  method: "GET" | "POST"
  description: string
  requiresAuth: boolean
  status: ProbeStatus
  statusCode?: number
  latencyMs?: number
  message?: string
  responsePreview?: string
}

export function AdminServerTestPage() {
  const [testingAll, setTestingAll] = useState(false)
  const [lastTestedAt, setLastTestedAt] = useState<Date | null>(null)
  const token = readToken()

  const initialProbes: ProbeResult[] = [
    {
      id: "root-index",
      name: "API Index",
      endpoint: "/",
      method: "GET",
      description: "Root service manifest",
      requiresAuth: false,
      status: "pending",
    },
    {
      id: "health-check",
      name: "Health Endpoint",
      endpoint: "/api/v1/health",
      method: "GET",
      description: "System live status check",
      requiresAuth: false,
      status: "pending",
    },
    {
      id: "auth-me",
      name: "Auth Session (/me)",
      endpoint: "/api/v1/auth/me",
      method: "GET",
      description: "Verifies current JWT Bearer token authentication",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "admin-dashboard",
      name: "Admin Dashboard Aggregates",
      endpoint: "/api/v1/admin/dashboard",
      method: "GET",
      description: "SQL aggregate statistics & operational metrics",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "incidents-list",
      name: "Incidents Feed (Paginated)",
      endpoint: "/api/v1/incidents?limit=5",
      method: "GET",
      description: "Incidents inbox data retrieval",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "departments-list",
      name: "Departments Roster",
      endpoint: "/api/v1/departments",
      method: "GET",
      description: "Emergency response departments registry",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "audit-logs",
      name: "Audit Log Feed",
      endpoint: "/api/v1/admin/audit-logs?limit=5",
      method: "GET",
      description: "Immutable administrative audit event ledger",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "notifications",
      name: "Notifications Inbox",
      endpoint: "/api/v1/notifications?limit=5",
      method: "GET",
      description: "In-app and dispatch notification stream",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "geo-proxy",
      name: "Geocoding Proxy",
      endpoint: "/api/v1/geo/search?q=Nairobi",
      method: "GET",
      description: "Open-Meteo place search gateway",
      requiresAuth: true,
      status: "pending",
    },
    {
      id: "weather-proxy",
      name: "Weather Proxy",
      endpoint: "/api/v1/weather/current?lat=-1.2864&lng=36.8172",
      method: "GET",
      description: "Site condition temperature & weather gateway",
      requiresAuth: true,
      status: "pending",
    },
  ]

  const [probes, setProbes] = useState<ProbeResult[]>(initialProbes)

  async function runSingleProbe(probeId: string) {
    const target = probes.find((p) => p.id === probeId)
    if (!target) return

    setProbes((prev) =>
      prev.map((p) => (p.id === probeId ? { ...p, status: "running", message: undefined } : p))
    )

    const startTime = performance.now()
    try {
      const fullUrl = buildUrl(target.endpoint)
      const headers: Record<string, string> = {
        Accept: "application/json",
      }
      if (target.requiresAuth && token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(fullUrl, {
        method: target.method,
        headers,
      })

      const latency = Math.round(performance.now() - startTime)
      const data = await res.json().catch(() => null)
      const preview = data ? JSON.stringify(data).slice(0, 160) : ""

      if (res.ok) {
        setProbes((prev) =>
          prev.map((p) =>
            p.id === probeId
              ? {
                  ...p,
                  status: "success",
                  statusCode: res.status,
                  latencyMs: latency,
                  message: "Connected OK",
                  responsePreview: preview,
                }
              : p
          )
        )
      } else {
        const errorMsg =
          (data && (data.message || data.error)) || `HTTP ${res.status} ${res.statusText}`
        setProbes((prev) =>
          prev.map((p) =>
            p.id === probeId
              ? {
                  ...p,
                  status: "failure",
                  statusCode: res.status,
                  latencyMs: latency,
                  message: errorMsg,
                  responsePreview: preview,
                }
              : p
          )
        )
      }
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - startTime)
      const errorMsg = err instanceof Error ? err.message : "Network request failed"
      setProbes((prev) =>
        prev.map((p) =>
          p.id === probeId
            ? {
                ...p,
                status: "failure",
                statusCode: 0,
                latencyMs: latency,
                message: errorMsg,
                responsePreview: undefined,
              }
            : p
        )
      )
    }
  }

  async function runAllProbes() {
    setTestingAll(true)
    for (const probe of probes) {
      await runSingleProbe(probe.id)
    }
    setTestingAll(false)
    setLastTestedAt(new Date())
  }

  useEffect(() => {
    runAllProbes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const successCount = probes.filter((p) => p.status === "success").length
  const failureCount = probes.filter((p) => p.status === "failure").length
  const totalCount = probes.length
  const overallHealthy = failureCount === 0 && successCount > 0

  return (
    <AdminShell
      title="Server Connection"
      breadcrumbs={[
        { label: "Admin", to: "/admin" },
        { label: "Server Connection" },
      ]}
      end={
        <Button
          variant="outline"
          size="sm"
          disabled={testingAll}
          onClick={() => runAllProbes()}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${testingAll ? "animate-spin" : ""}`} />
          <span>{testingAll ? "Testing..." : "Retest All"}</span>
        </Button>
      }
    >
      <AdminPage wide className="space-y-6">
        {/* Connection Overview Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
              {overallHealthy ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : failureCount > 0 ? (
                <XCircle className="size-4 text-destructive" />
              ) : (
                <Activity className="size-4 text-amber-500 animate-pulse" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {overallHealthy ? "Connected" : failureCount > 0 ? "Issues Found" : "Testing..."}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {successCount}/{totalCount} endpoints operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Target</CardTitle>
              <Server className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono font-semibold truncate" title={env.apiBase || "(Relative /)"}>
                {env.apiBase || "Relative (/)"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant={env.useMockApi ? "secondary" : "default"} className="text-[10px] h-4 px-1">
                  {env.useMockApi ? "Mock Mode" : "Live REST API"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bearer JWT</CardTitle>
              <ShieldCheck className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold flex items-center gap-1.5">
                {token ? (
                  <>
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Authenticated</span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Anonymous</span>
                  </>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                {token ? `${token.slice(0, 16)}...` : "No session token"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Tested</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {lastTestedAt ? lastTestedAt.toLocaleTimeString() : "Just now"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg latency:{" "}
                {Math.round(
                  probes.filter((p) => p.latencyMs).reduce((a, b) => a + (b.latencyMs || 0), 0) /
                    (probes.filter((p) => p.latencyMs).length || 1)
                )}
                ms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Probes Main Card */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" />
              <span>Backend Endpoint Health Checks</span>
            </CardTitle>
            <CardDescription>
              Real-time connectivity and status probes against Flask backend route handlers and Supabase PostgreSQL.
            </CardDescription>
          </CardHeader>

          {/* Mobile view (< md): Responsive card list */}
          <div className="block md:hidden border-t divide-y divide-border">
            {probes.map((probe) => (
              <div key={probe.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{probe.name}</div>
                    <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 break-all">
                      <span className="rounded bg-muted px-1 py-0.2 text-[10px] font-bold text-muted-foreground">
                        {probe.method}
                      </span>
                      <span>{probe.endpoint}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {probe.status === "running" ? (
                      <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
                        <RefreshCw className="size-3 animate-spin" />
                        <span>Testing</span>
                      </Badge>
                    ) : probe.status === "success" ? (
                      <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <CheckCircle2 className="size-3" />
                        <span>{probe.statusCode ? `HTTP ${probe.statusCode}` : "OK"}</span>
                      </Badge>
                    ) : probe.status === "failure" ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="size-3" />
                        <span>{probe.statusCode ? `HTTP ${probe.statusCode}` : "Failed"}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{probe.description}</span>
                  {probe.latencyMs !== undefined && (
                    <span className="font-mono">{probe.latencyMs}ms</span>
                  )}
                </div>

                {probe.message && (
                  <p
                    className={`text-xs font-medium ${
                      probe.status === "failure" ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {probe.message}
                  </p>
                )}

                {probe.responsePreview && (
                  <pre className="rounded-md bg-muted/50 p-2 font-mono text-[11px] text-muted-foreground overflow-x-auto break-all whitespace-pre-wrap max-h-24">
                    {probe.responsePreview}
                  </pre>
                )}

                <div className="pt-1 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={probe.status === "running"}
                    onClick={() => runSingleProbe(probe.id)}
                  >
                    <RefreshCw className={`size-3 ${probe.status === "running" ? "animate-spin" : ""}`} />
                    <span>Retest</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view (>= md): Data table */}
          <div className="hidden md:block border-t">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] lg:w-[240px]">Endpoint</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[90px]">Latency</TableHead>
                    <TableHead>Response / Message</TableHead>
                    <TableHead className="w-[80px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {probes.map((probe) => (
                    <TableRow key={probe.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{probe.name}</div>
                        <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-neutral-500 bg-muted px-1 rounded">
                            {probe.method}
                          </span>
                          <span className="truncate max-w-[150px] lg:max-w-xs" title={probe.endpoint}>
                            {probe.endpoint}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {probe.status === "running" ? (
                          <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
                            <RefreshCw className="size-3 animate-spin" />
                            <span>Testing</span>
                          </Badge>
                        ) : probe.status === "success" ? (
                          <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                            <CheckCircle2 className="size-3" />
                            <span>HTTP {probe.statusCode}</span>
                          </Badge>
                        ) : probe.status === "failure" ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="size-3" />
                            <span>{probe.statusCode ? `HTTP ${probe.statusCode}` : "Failed"}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {probe.latencyMs !== undefined ? `${probe.latencyMs}ms` : "-"}
                      </TableCell>

                      <TableCell>
                        {probe.message && (
                          <div
                            className={`text-xs font-medium ${
                              probe.status === "failure" ? "text-destructive" : "text-foreground"
                            }`}
                          >
                            {probe.message}
                          </div>
                        )}
                        {probe.responsePreview && (
                          <div
                            className="font-mono text-[11px] text-muted-foreground truncate max-w-sm lg:max-w-md xl:max-w-lg mt-0.5"
                            title={probe.responsePreview}
                          >
                            {probe.responsePreview}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={probe.status === "running"}
                          onClick={() => runSingleProbe(probe.id)}
                          title="Re-run this test"
                        >
                          <RefreshCw
                            className={`size-3.5 ${probe.status === "running" ? "animate-spin" : ""}`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </div>
        </Card>
      </AdminPage>
    </AdminShell>
  )
}
