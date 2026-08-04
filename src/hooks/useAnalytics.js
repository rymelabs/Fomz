import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageView, 
  trackSessionStart, 
  trackSessionEnd,
  trackPageLoadTime 
} from '../services/analyticsService';

// Map routes to friendly page names
const PAGE_NAMES = {
  '/': 'Landing',
  '/dashboard': 'My Forms',
  '/dashboard/create': 'Create Form',
  '/dashboard/drafts': 'Drafts',
  '/dashboard/analytics': 'Analytics Overview',
  '/dashboard/profile': 'Profile',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/forms': 'My Forms',
  '/local/forms': 'Local Forms',
  '/builder': 'Form Builder',
  '/builder/preview': 'Form Preview',
};

// Get friendly page name from path
const getPageName = (pathname) => {
  // Check exact matches first
  if (PAGE_NAMES[pathname]) {
    return PAGE_NAMES[pathname];
  }
  
  // Check pattern matches
  if (pathname.startsWith('/dashboard/analytics/')) {
    return 'Form Analytics';
  }
  if (pathname.startsWith('/forms/') && pathname.endsWith('/responses')) {
    return 'Form Responses';
  }
  if (pathname.startsWith('/forms/') && pathname.endsWith('/fill')) {
    return 'Fill Form';
  }
  if (pathname.startsWith('/fill/')) {
    return 'Fill Form';
  }
  if (pathname.startsWith('/f/')) {
    return 'Short Link Redirect';
  }
  
  return 'Unknown Page';
};

/**
 * Hook to automatically track page views on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();
  const pageLoadStart = useRef(performance.now());

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    const loadTime = Math.round(performance.now() - pageLoadStart.current);
    
    // Track page view
    trackPageView(pageName, window.location.href);
    
    // Track page load time
    trackPageLoadTime(pageName, loadTime);
    
    // Reset timer for next page
    pageLoadStart.current = performance.now();
  }, [location.pathname]);
};

/**
 * Hook to track session duration
 */
export const useSessionTracking = () => {
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    // Track session start
    trackSessionStart();

    // Track session end on page unload
    const handleUnload = () => {
      const sessionDuration = Math.round((Date.now() - sessionStart.current) / 1000);
      trackSessionEnd(sessionDuration);
    };

    // Use beforeunload for session tracking
    window.addEventListener('beforeunload', handleUnload);
    
    // Also track on visibility change (mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const sessionDuration = Math.round((Date.now() - sessionStart.current) / 1000);
        trackSessionEnd(sessionDuration);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

export default usePageTracking;
