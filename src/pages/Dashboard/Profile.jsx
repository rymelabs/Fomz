import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ThemeSelector from '../../components/builder/ThemeSelector';
import { updateDisplayName, deleteAccount } from '../../services/userService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { logout, forgotPassword } = useAuth();
  const setTheme = useThemeStore((state) => state.setTheme);
  const setAppBackground = useThemeStore((state) => state.setAppBackground);
  const appBackgroundId = useThemeStore((state) => state.appBackgroundId || 'default');
  const appOptions = useThemeStore((state) => state.appBackgroundOptions);
  const currentBgOption = appOptions.find((o) => o.id === appBackgroundId) || appOptions[0];
  const [visibleCount, setVisibleCount] = useState(9);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberSince = useMemo(() => {
    const creationTime = user?.metadata?.creationTime;
    if (creationTime) {
      return new Date(creationTime).toLocaleDateString();
    }
    return null;
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.displayName || '';
    if (name) {
      return name.trim().charAt(0).toUpperCase();
    }
    const email = user?.email || '';
    if (email) return email.trim().charAt(0).toUpperCase();
    return 'F';
  }, [user]);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(displayName.trim());
      toast.success('Name updated');
    } catch (err) {
      console.error('Failed to update name', err);
      toast.error('Unable to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast.error('No email associated with this account');
      return;
    }
    try {
      await forgotPassword(user.email);
      toast.success('Password reset email sent');
    } catch (err) {
      console.error('Reset password failed', err);
      toast.error('Unable to send reset email');
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm('Delete your account? This cannot be undone.');
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      console.error('Delete account failed', err);
      toast.error('Unable to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-gray-800">Please sign in to view your profile.</p>
        <Button size="sm" className="mt-3" onClick={() => navigate('/')}>Back home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-gray-200" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sky-900 border border-sky-100 text-base font-semibold"
              style={{ backgroundColor: currentBgOption.avatarBg || '#e0f2fe' }}
            >
              {initials || 'F'}
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Profile</p>
            <h1 className="font-display text-xl text-gray-900">Your account</h1>
            {memberSince && <p className="text-[11px] text-gray-500">Member since {memberSince}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
          <p className="text-xs font-semibold text-gray-900 mb-3">User info</p>
          <div className="space-y-3">
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="px-3 py-1.5 text-sm"
              containerClassName="space-y-0.5"
            />
            <Input
              label="Email"
              value={user.email || ''}
              disabled
              className="px-3 py-1.5 text-sm"
              containerClassName="space-y-0.5"
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveName} disabled={saving} className="px-2.5 py-1 text-xs">
                {saving ? 'Saving…' : 'Save name'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetPassword} className="px-2.5 py-1 text-xs">
                Reset password
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
          <p className="text-xs font-semibold text-gray-900 mb-3">Preferences</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">App background</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAppBackground('default')}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    appBackgroundId === 'default'
                      ? 'border-sky-500 text-sky-700 bg-sky-50'
                      : 'border-gray-200 text-gray-700 hover:border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-gray-200 bg-white" />
                    Default
                  </span>
                  <span className="text-[10px] text-gray-400">reset</span>
                </button>
                {appOptions.slice(0, visibleCount).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAppBackground(opt.id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      appBackgroundId === opt.id
                        ? 'border-sky-500 text-sky-700 bg-sky-50'
                        : 'border-gray-200 text-gray-700 hover:border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: opt.base }}
                      />
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-gray-400">blob</span>
                  </button>
                ))}
              </div>
              {appOptions.length > 9 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Showing {Math.min(visibleCount, appOptions.length)} of {appOptions.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleCount(9)}
                      disabled={visibleCount <= 9}
                      className="text-[11px] font-semibold text-gray-700 underline-offset-4 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      See less
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + 6, appOptions.length))}
                      disabled={visibleCount >= appOptions.length}
                      className="text-[11px] font-semibold text-gray-700 underline-offset-4 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      See more
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              Notification preferences can be managed in the notifications page.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
        <p className="text-xs font-semibold text-gray-900 mb-3">Account actions</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="px-3 py-1.5 text-sm" onClick={logout}>
            Sign out
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 px-3 py-1.5 text-sm">
            {deleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
