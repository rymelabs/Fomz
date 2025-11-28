import React from 'react';
import { Crown, Cloud, Zap, Shield, X } from 'lucide-react';
import Button from '../ui/Button';

/**
 * UpgradeBanner Component
 * Shows benefits of signing in for anonymous users
 * 
 * @param {string} variant - 'default', 'compact', 'inline'
 * @param {Function} onSignIn - Callback when sign in button clicked
 * @param {Function} onDismiss - Optional callback when banner is dismissed
 * @param {boolean} dismissible - Whether the banner can be dismissed
 * @param {string} context - Context for messaging: 'forms', 'responses', 'analytics', 'publish'
 */
const UpgradeBanner = ({ 
  variant = 'default', 
  onSignIn, 
  onDismiss,
  dismissible = false,
  context = 'forms'
}) => {
  
  const contextMessages = {
    forms: {
      title: "Your forms are saved locally",
      subtitle: "Sign in to sync across devices and keep them forever",
      icon: Cloud
    },
    responses: {
      title: "Responses stored in your browser",
      subtitle: "Sign in for unlimited storage and advanced analytics",
      icon: Shield
    },
    analytics: {
      title: "Local analytics only",
      subtitle: "Sign in to unlock real-time insights and detailed reports",
      icon: Zap
    },
    publish: {
      title: "Form published locally",
      subtitle: "Sign in to share across the web and track responses forever",
      icon: Crown
    }
  };
  
  const message = contextMessages[context] || contextMessages.forms;
  const Icon = message.icon;
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">{message.title}</p>
            <p className="text-xs text-blue-700">{message.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-full hover:bg-blue-100 transition-colors text-blue-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            onClick={onSignIn}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-none whitespace-nowrap"
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
        <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-800 flex-1">{message.subtitle}</p>
        <button
          onClick={onSignIn}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap"
        >
          Sign in
        </button>
      </div>
    );
  }
  
  // Default variant - full banner
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6">
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-blue-100 transition-colors text-blue-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900">
            {message.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-blue-700">
            {message.subtitle}
          </p>
          
          <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <Cloud className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-900">Cloud Sync</p>
                <p className="text-[10px] sm:text-xs text-blue-700">Access from any device</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-900">Secure Storage</p>
                <p className="text-[10px] sm:text-xs text-blue-700">Never lose your data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-900">Advanced Features</p>
                <p className="text-[10px] sm:text-xs text-blue-700">Unlimited AI generations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <Crown className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-900">Premium Analytics</p>
                <p className="text-[10px] sm:text-xs text-blue-700">Detailed insights & exports</p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={onSignIn}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Crown className="h-4 w-4 mr-2" />
              Sign In to Upgrade
            </Button>
            <span className="text-xs text-blue-600 text-center sm:text-left">
              Free forever • No credit card required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;
