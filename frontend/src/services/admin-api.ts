import {
  apiGetAuditLogs,
  apiGetDashboardStats,
  apiGetUsers,
} from "@/data/api"

export const adminApi = {
  getDashboardStats() {
    return apiGetDashboardStats()
  },
  getAuditLogs(options?: { incidentId?: string }) {
    return apiGetAuditLogs(options)
  },
  /** Reserved for a future Admin Users page — not wired in Sprint 1 UI. */
  getUsers() {
    return apiGetUsers()
  },
}
