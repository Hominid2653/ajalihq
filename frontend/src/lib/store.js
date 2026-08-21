import { configureStore, createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {"received" | "under investigation" | "rejected" | "resolved" | "closed"} IncidentStatus
 */

/**
 * @typedef {{
 *   id: string,
 *   incidentId: string,
 *   title: string,
 *   message: string,
 *   statusUpdate: IncidentStatus,
 *   timestamp: string,
 *   isRead: boolean
 * }} SystemNotification
 */

/**
 * @typedef {{
 *   items: SystemNotification[],
 *   unreadCount: number
 * }} NotificationState
 */

/** @type {NotificationState} */
const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Loads baseline notifications (can be wired to your JSON server / mock data later)
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    // Marks a single system notification alert as read
    markAsRead: (state, action) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    // Dynamically appends a new incident alert to the feed in real-time
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
});

export const { setNotifications, markAsRead, addNotification } = notificationSlice.actions;

export const store = configureStore({
  reducer: {
    notifications: notificationSlice.reducer,
  },
});

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
