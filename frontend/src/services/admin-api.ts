import {
  apiGetAuditLogs,
  apiGetDashboardStats,
  apiGetUsers,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient, type PaginatedEnvelope } from "@/lib/http-client"
import type { AuthUser } from "@/types/auth"
import type { AuditLog, DashboardStats } from "@/types/incident"

export const adminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (!env.useMockApi) {
      return apiClient.get<DashboardStats>("/api/v1/admin/dashboard")
    }
    return apiGetDashboardStats()
  },

  async getAuditLogs(options?: {
    incidentId?: string
    limit?: number
    offset?: number
  }): Promise<AuditLog[]> {
    if (!env.useMockApi) {
      const res = await apiClient.get<PaginatedEnvelope<AuditLog>>(
        "/api/v1/admin/audit-logs",
        options as Record<string, unknown>
      )
      return res.items
    }
    return apiGetAuditLogs(options)
  },

  async getUsers(options?: {
    limit?: number
    offset?: number
  }): Promise<AuthUser[]> {
    if (!env.useMockApi) {
      const res = await apiClient.get<PaginatedEnvelope<AuthUser>>(
        "/api/v1/admin/users",
        options as Record<string, unknown>
      )
      return res.items
    }
    return apiGetUsers()
  },
}
