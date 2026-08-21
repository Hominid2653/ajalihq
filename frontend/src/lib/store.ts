import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Strictly typed notification statuses supporting citizen and admin flows
export type NotificationStatus = "new" | "rejected" | "resolved" | "closed" | "under investigation" | "received";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  statusUpdate: NotificationStatus;
}

// Initial mock dataset from your Trello reference criteria
const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Incident escalated",
    message: "A new report has been assigned for review by the response team.",
    timestamp: "2 minutes ago",
    isRead: false,
    statusUpdate: "new",
  },
  {
    id: "2",
    title: "Report resolved",
    message: "The maintenance team marked the issue as resolved and closed.",
    timestamp: "18 minutes ago",
    isRead: true,
    statusUpdate: "resolved",
  },
  {
    id: "3",
    title: "Submission rejected",
    message: "Additional details were requested before the incident can proceed.",
    timestamp: "1 hour ago",
    isRead: false,
    statusUpdate: "rejected",
  },
];

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.isRead).length,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Sets or overrides the current notification feed (useful for future API integration)
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    // Finds an item by ID, toggles its read status, and decreases unreadCount safely
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { setNotifications, markAsRead } = notificationSlice.actions;

export const store = configureStore({
  reducer: {
    notifications: notificationSlice.reducer,
  },
});

// Infer global store states and dispatch types for safe layout connection
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
