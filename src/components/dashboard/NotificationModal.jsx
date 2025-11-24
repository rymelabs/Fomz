import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-purple-50 opacity-80" />
        <div className="relative p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-red-500 font-semibold">
                    High priority
                  </p>
                  <h3 className="mt-1 font-display text-xl text-gray-900">
                    {notification.title || 'Alert'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-3 text-gray-700 leading-relaxed">{notification.message}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-red-500 to-purple-600 text-white border-none shadow-md hover:shadow-lg transition-all"
            >
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

