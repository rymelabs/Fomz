import React, { useState, useEffect, useRef } from 'react';import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileEdit, BarChart3, LogOut, User2, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/dashboard/NotificationBell';
import NotificationModal from '../components/dashboard/NotificationModal';
import { useNotificationStore } from '../store/notificationStore';
import { useThemeStore } from '../store/themeStore';

const navItems = [
  { label: 'My Forms', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Create', icon: FileEdit, path: '/dashboard/create' },
  { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' }
];

const DashboardLayout = ({ children }) => {
  const { user, loading, signInGoogle, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    unreadCount,
    activeHighPriority,
    startListening,
    stopListening,
    acknowledgeHighPriority,
  } = useNotificationStore();
  const appBackground = useThemeStore((state) => state.appBackground || '#ffffff');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      startListening(user.uid);
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [user, startListening, stopListening]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: appBackground }}>
      <div className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#7CA7FF] via-[#7CA7FF]/60 to-transparent opacity-60 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-0 -left-32 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tl from-[#B6F3CF] via-[#B6F3CF]/70 to-transparent opacity-90 blur-3xl"></div>

      <div className="relative flex min-h-screen flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <div>
              <p className="font-display font-semibold text-4xl text-gray-900">fomz</p>
              <p className="font-poppins text-[7px] tracking-[0.5em] text-gray-500">by RymeLabs</p>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-[0.65rem] uppercase tracking-[0.4em] text-gray-500">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-full px-3 py-2 transition ${
                      isActive
                        ? 'text-gray-900'
                        : 'hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {user && (
                <NotificationBell
                  unreadCount={unreadCount}
                  hasHighPriority={Boolean(activeHighPriority)}
                  pulse={Boolean(activeHighPriority)}
                  onClick={() => navigate('/dashboard/notifications')}
                />
              )}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-gray-300 bg-white p-1 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {user.displayName?.[0]?.toUpperCase() || <User2 className="h-4 w-4" />}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <button
                        onClick={() => {
                          navigate('/dashboard/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User2 className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        disabled={loading}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {loading ? 'Signing out...' : 'Log out'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="text-xs uppercase tracking-[0.4em] text-gray-600"
                  onClick={signInGoogle}
                  disabled={loading}
                >
                  {loading ? 'Connecting…' : 'Sign in'}
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden border-t border-gray-200/60">
            <div className="flex justify-around px-4 py-3 text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-1 ${isActive ? 'text-gray-900' : ''}`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className={`mx-auto w-full max-w-5xl px-6 py-12 pt-40 ${location.pathname.startsWith('/builder') ? 'w-full max-w-6xl' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      <NotificationModal
        notification={activeHighPriority}
        onClose={() => acknowledgeHighPriority(user?.uid)}
      />
    </div>
  );
};

export default DashboardLayout;
