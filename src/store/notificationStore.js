import { create } from 'zustand';
import {
  createNotification as createNotificationService,
  getNotifications,
  getUserNotifications,
  markNotificationDelivered,
  markNotificationRead,
  markUserNotificationRead,
  subscribeToNotifications,
  subscribeToUserNotifications,
} from '../services/notificationService';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  userNotifications: [], // User-specific notifications (like response alerts)
  unreadCount: 0,
  loading: false,
  error: null,
  activeHighPriority: null,
  unsubscribe: null,
  userUnsubscribe: null,

  startListening: (userId) => {
    if (!userId) return;
    const currentUnsub = get().unsubscribe;
    const currentUserUnsub = get().userUnsubscribe;
    currentUnsub?.();
    currentUserUnsub?.();

    // Subscribe to global/admin notifications
    const unsubscribe = subscribeToNotifications(userId, (items) => {
      const highPriority = items.find(
        (n) => n.priority === 'high' && !n.delivered
      );

      set((state) => ({
        notifications: items,
        unreadCount: items.filter((n) => !n.read).length + state.userNotifications.filter((n) => !n.read).length,
        activeHighPriority: highPriority || null,
        error: null,
      }));

      if (highPriority) {
        markNotificationDelivered(userId, highPriority.id).catch((err) =>
          console.error('Failed to mark high priority as delivered', err)
        );
      }
    });

    // Subscribe to user-specific notifications (response alerts, etc.)
    const userUnsubscribe = subscribeToUserNotifications(userId, (items) => {
      set((state) => ({
        userNotifications: items,
        unreadCount: state.notifications.filter((n) => !n.read).length + items.filter((n) => !n.read).length,
      }));
    });

    set({ unsubscribe, userUnsubscribe });
  },

  stopListening: () => {
    const currentUnsub = get().unsubscribe;
    const currentUserUnsub = get().userUnsubscribe;
    currentUnsub?.();
    currentUserUnsub?.();
    set({ unsubscribe: null, userUnsubscribe: null, notifications: [], userNotifications: [], unreadCount: 0, activeHighPriority: null });
  },

  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const [items, userItems] = await Promise.all([
        getNotifications(userId),
        getUserNotifications(userId)
      ]);
      const highPriority = items.find(
        (n) => n.priority === 'high' && !n.delivered
      );
      set({
        notifications: items,
        userNotifications: userItems,
        unreadCount: items.filter((n) => !n.read).length + userItems.filter((n) => !n.read).length,
        activeHighPriority: highPriority || null,
      });
      if (highPriority) {
        await markNotificationDelivered(userId, highPriority.id);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      set({ error: error.message || 'Failed to load notifications' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId, userId, isUserNotification = false) => {
    if (!notificationId || !userId) return;
    
    if (isUserNotification) {
      await markUserNotificationRead(userId, notificationId);
      set((state) => ({
        userNotifications: state.userNotifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } else {
      await markNotificationRead(userId, notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true, delivered: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        activeHighPriority:
          state.activeHighPriority?.id === notificationId
            ? null
            : state.activeHighPriority,
      }));
    }
  },

  acknowledgeHighPriority: async (userId) => {
    const notification = get().activeHighPriority;
    if (!notification) return;
    await markNotificationRead(userId, notification.id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notification.id ? { ...n, read: true, delivered: true } : n
      ),
      unreadCount: state.notifications.filter((n) => !n.read).length,
      activeHighPriority: null,
    }));
  },

  createNotification: async (payload) => {
    return await createNotificationService(payload);
  },
}));

