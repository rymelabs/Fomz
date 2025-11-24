import { create } from 'zustand';
import {
  createNotification as createNotificationService,
  getNotifications,
  markNotificationDelivered,
  markNotificationRead,
  subscribeToNotifications,
} from '../services/notificationService';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  activeHighPriority: null,
  unsubscribe: null,

  startListening: (userId) => {
    if (!userId) return;
    const currentUnsub = get().unsubscribe;
    currentUnsub?.();

    const unsubscribe = subscribeToNotifications(userId, (items) => {
      const highPriority = items.find(
        (n) => n.priority === 'high' && !n.delivered
      );

      set({
        notifications: items,
        unreadCount: items.filter((n) => !n.read).length,
        activeHighPriority: highPriority || null,
        error: null,
      });

      if (highPriority) {
        markNotificationDelivered(userId, highPriority.id).catch((err) =>
          console.error('Failed to mark high priority as delivered', err)
        );
      }
    });

    set({ unsubscribe });
  },

  stopListening: () => {
    const currentUnsub = get().unsubscribe;
    currentUnsub?.();
    set({ unsubscribe: null, notifications: [], unreadCount: 0, activeHighPriority: null });
  },

  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const items = await getNotifications(userId);
      const highPriority = items.find(
        (n) => n.priority === 'high' && !n.delivered
      );
      set({
        notifications: items,
        unreadCount: items.filter((n) => !n.read).length,
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

  markAsRead: async (notificationId, userId) => {
    if (!notificationId || !userId) return;
    await markNotificationRead(userId, notificationId);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true, delivered: true } : n
      ),
      unreadCount: Math.max(
        0,
        state.notifications.filter((n) => n.id !== notificationId && !n.read).length
      ),
      activeHighPriority:
        state.activeHighPriority?.id === notificationId
          ? null
          : state.activeHighPriority,
    }));
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

