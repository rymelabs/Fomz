import React from 'react';
import { Bell, AlertTriangle } from 'lucide-react';

const NotificationBell = ({
  unreadCount = 0,
  hasHighPriority = false,
  onClick,
  pulse = false,
}) => {
  const badgeText = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 transition active:scale-95"
      aria-label="Notifications"
    >
      <style>{`
        @keyframes bell-ring {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(12deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <div className="relative">
        <Bell
          className="h-5 w-5 text-gray-700"
          style={
            unreadCount > 0
              ? { animation: 'bell-ring 1.2s ease-in-out infinite', transformOrigin: '50% 10%' }
              : undefined
          }
        />
        {hasHighPriority && (
          <AlertTriangle className="h-3 w-3 text-red-500 absolute -bottom-1 -right-1 drop-shadow-sm" />
        )}
      </div>
      {unreadCount > 0 && (
        <span
          className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white ${
            pulse ? 'animate-pulse' : ''
          }`}
        >
          {badgeText}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
