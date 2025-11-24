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
  return (
    <Card
      className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
        isHigh ? 'border-red-200 bg-red-50/50' : ''
      } ${!isRead ? 'border-gray-200 shadow-sm' : 'border-transparent'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
            isHigh ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
          }`}
        >
          {isHigh ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{notification.title || 'Notification'}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                isHigh
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {notification.priority === 'high' ? 'High' : 'Normal'}
            </span>
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-primary-500 inline-block"></span>
            )}
          </div>
          <p className="mt-1 text-gray-700">{notification.message || 'No details provided.'}</p>
          <p className="mt-2 text-xs text-gray-500">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
      {!isRead && (
        <Button
          size="sm"
          onClick={onMarkRead}
          className="self-start md:self-auto"
          variant="outline"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark read
        </Button>
      )}
    </Card>
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
        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Admin</p>
              <h2 className="font-display text-xl text-gray-900">Broadcast notification</h2>
              <p className="text-sm text-gray-600">
                Send a message to all users. High priority will pop up immediately.
              </p>
            </div>
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">
              Admin only
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              label="Title"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Scheduled maintenance"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                rows={3}
                value={formState.message}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Let users know what is happening..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <div className="flex gap-2">
                {['normal', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`rounded-full px-3 py-1 text-sm border transition ${
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
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
