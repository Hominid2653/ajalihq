import {
  apiCreateNotification,
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from "@/data/api"
import { env } from "@/lib/env"
import { apiClient, type PaginatedEnvelope } from "@/lib/http-client"
import type { AppNotification, NotificationChannel } from "@/types/incident"

export const notificationApi = {
  async getAll(options?: { limit?: number; offset?: number }): Promise<AppNotification[]> {
    if (!env.useMockApi) {
      const res = await apiClient.get<PaginatedEnvelope<AppNotification>>(
        "/api/v1/notifications",
        options as Record<string, unknown>
      )
      return res.items
    }
    return apiGetNotifications()
  },

  async markAsRead(id: string): Promise<AppNotification | null> {
    if (!env.useMockApi) {
      return apiClient.post<AppNotification>(`/api/v1/notifications/${id}/read`)
    }
    return apiMarkNotificationRead(id)
  },

  async markAllAsRead(): Promise<number> {
    if (!env.useMockApi) {
      const res = await apiClient.post<{ count: number }>("/api/v1/notifications/read-all")
      return res.count
    }
    return apiMarkAllNotificationsRead()
  },

  async create(input: {
    incidentId?: string
    recipientId?: string
    toEmail?: string
    type: string
    channel: NotificationChannel
    title: string
    body: string
  }): Promise<AppNotification> {
    if (!env.useMockApi) {
      return apiClient.post<AppNotification>("/api/v1/notifications", input)
    }
    return apiCreateNotification(input)
  },
}
