import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Loader2, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useNotificationStore } from '../../store/notificationStore';
import { useUserStore } from '../../store/userStore';

const parseAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const formatDate = (timestamp) => {
  try {
    if (!timestamp) return 'Just now';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return 'Just now';
  }
};

const NotificationItem = ({ notification, onMarkRead, isRead }) => {
  const isHigh = notification.priority === 'high';
  const iconClass = isHigh ? 'text-red-600' : 'text-gray-600';
  const badgeClass = isHigh
    ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div
      className="relative px-1 py-2 md:px-2 border-b border-gray-200"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600">
          {isHigh ? (
            <AlertTriangle className={`h-4 w-4 ${iconClass}`} />
          ) : (
            <Bell className={`h-4 w-4 ${iconClass}`} />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>}
            <h3 className="font-semibold text-gray-900 leading-tight text-sm">
              {notification.title || 'Notification'}
            </h3>
            {isHigh && (
              <span className={`rounded-full px-2 py-[1px] text-[10px] font-semibold ${badgeClass}`}>
                High
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-snug">
            {notification.message || 'No details provided.'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>{formatDate(notification.createdAt)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>{isHigh ? 'Important' : 'Update'}</span>
          </div>
        </div>
        {!isRead && (
          <button
            onClick={onMarkRead}
            className="mt-1 inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-900"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done
          </button>
        )}
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user } = useUserStore();
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    createNotification,
    unreadCount,
  } = useNotificationStore();

  const [formState, setFormState] = useState({
    title: '',
    message: '',
    priority: 'normal',
  });
  const [creating, setCreating] = useState(false);

  const isAdmin = useMemo(() => {
    const adminEmails = parseAdminEmails();
    const email = user?.email?.toLowerCase();
    return user?.role === 'admin' || (email && adminEmails.includes(email));
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user, fetchNotifications]);

  const handleCreate = async () => {
    if (!isAdmin || !formState.title.trim() || !formState.message.trim()) return;
    setCreating(true);
    try {
      await createNotification({
        ...formState,
        createdBy: user?.uid,
      });
      setFormState({ title: '', message: '', priority: 'normal' });
      await fetchNotifications(user.uid);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-800 font-semibold">Sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Inbox</p>
          <h1 className="mt-1 font-display text-2xl text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">
            Stay on top of admin alerts, publishing updates, and shared links.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 whitespace-nowrap md:px-3 md:py-1.5 md:text-sm">
          <Bell className="h-4 w-4" />
          {unreadCount} unread
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <p className="font-semibold">Unable to load notifications</p>
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {isAdmin && (
        <Card className="border border-gray-200 bg-white/90 backdrop-blur-none shadow-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-semibold">Admin</p>
              <h2 className="font-display text-lg text-gray-900">Broadcast notification</h2>
              <p className="text-xs text-gray-600">
                Send a quick update to everyone. High priority pops up instantly.
              </p>
            </div>
            <span className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              Admin only
            </span>
          </div>

          <div className="mt-3 space-y-3">
            <Input
              label="Title"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Scheduled maintenance"
              className="text-sm"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                rows={3}
                value={formState.message}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Let users know what is happening..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <div className="flex gap-2">
                {['normal', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`rounded-full px-3 py-[6px] text-xs border transition ${
                      formState.priority === level
                        ? 'border-gray-900 text-gray-900'
                        : 'border-gray-200 text-gray-600'
                    }`}
                    onClick={() => setFormState((prev) => ({ ...prev, priority: level }))}
                  >
                    {level === 'high' ? 'High priority' : 'Normal'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                disabled={creating || !formState.title.trim() || !formState.message.trim()}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 border-none"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Broadcast
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-4 font-display text-2xl text-gray-900">No notifications yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              You will see admin updates and alerts here once they arrive.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isRead={notification.read}
              onMarkRead={() => markAsRead(notification.id, user.uid)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
