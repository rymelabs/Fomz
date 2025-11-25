import React from 'react';
import { Bell, X } from 'lucide-react';

const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/80 bg-white/20 animate-scale-in">
        <style>{`
          @keyframes bell-ring-interval {
            0% { transform: rotate(0deg); }
            2% { transform: rotate(12deg); }
            4% { transform: rotate(-12deg); }
            6% { transform: rotate(10deg); }
            8% { transform: rotate(-10deg); }
            10% { transform: rotate(6deg); }
            12% { transform: rotate(-6deg); }
            15% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
        <div className="relative p-5 space-y-3 text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-gray-800">
            <Bell
              className="h-5 w-5"
              style={{
                animation: 'bell-ring-interval 30s ease-in-out infinite',
                transformOrigin: '50% 10%',
              }}
            />
          </div>
          <h3 className="font-display text-lg text-gray-900 leading-tight">
            {notification.title || 'Alert'}
          </h3>
          <p className="text-sm text-gray-800 leading-snug">
            {notification.message || 'No details provided.'}
          </p>
          <div className="flex justify-center pt-1">
            <button
              onClick={onClose}
              className="inline-flex min-w-[200px] justify-center items-center gap-2 rounded-full border-2 border-blue-600 px-6 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
