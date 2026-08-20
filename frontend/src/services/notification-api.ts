import {
  apiCreateNotification,
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from "@/data/api"
import type { NotificationChannel } from "@/types/incident"

export const notificationApi = {
  getAll() {
    return apiGetNotifications()
  },
  markAsRead(id: string) {
    return apiMarkNotificationRead(id)
  },
  markAllAsRead() {
    return apiMarkAllNotificationsRead()
  },
  create(input: {
    incidentId?: string
    type: string
    channel: NotificationChannel
    title: string
    body: string
  }) {
    return apiCreateNotification(input)
  },
}
