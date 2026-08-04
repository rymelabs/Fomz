import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/global.css';
import { useAuth } from './hooks/useAuth';
import ThemeProvider from './components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { useUserStore } from './store/userStore';
import { hasLocalFormsToMigrate } from './services/migrationService';
import MigrationModal from './components/ui/MigrationModal';
import { 
  setAnalyticsUserId, 
  setAnalyticsUserProperties,
  trackLogin,
  trackLogout,
  trackSessionStart,
  trackUserLocation
} from './services/analyticsService';

const App = () => {
  const { initializing } = useAuth();
  const { isAuthenticated, user } = useUserStore();
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [prevAuthState, setPrevAuthState] = useState(null);

  // Track session start and user location on mount
  useEffect(() => {
    trackSessionStart();
    trackUserLocation(); // Capture user's location via IP geolocation
  }, []);

  // Track authentication changes and set user analytics
  useEffect(() => {
    if (isAuthenticated && user) {
      // Set user ID for analytics
      setAnalyticsUserId(user.uid);
      
      // Set user properties
      setAnalyticsUserProperties({
        user_type: 'authenticated',
        sign_in_provider: user.providerData?.[0]?.providerId || 'unknown',
      });
      
      // Track login if previously not authenticated
      if (prevAuthState === false) {
        trackLogin(user.providerData?.[0]?.providerId || 'email');
      }
    } else if (!isAuthenticated && prevAuthState === true) {
      // User just logged out
      trackLogout();
      setAnalyticsUserProperties({
        user_type: 'anonymous',
      });
    }
    
    setPrevAuthState(isAuthenticated);
  }, [isAuthenticated, user, prevAuthState]);

  // Check for local forms to migrate when user signs in
  useEffect(() => {
    if (isAuthenticated && user && !migrationChecked) {
      setMigrationChecked(true);
      // Check if there are local forms to migrate
      const hasLocalForms = hasLocalFormsToMigrate();
      console.log('Migration check:', { isAuthenticated, hasLocalForms, user: user?.uid });
      if (hasLocalForms) {
        // Small delay to let auth flow complete
        setTimeout(() => {
          setShowMigrationModal(true);
        }, 1000);
      }
    }
    
    // Reset migration check when user signs out
    if (!isAuthenticated && migrationChecked) {
      setMigrationChecked(false);
    }
  }, [isAuthenticated, user, migrationChecked]);

  const handleMigrationComplete = (results) => {
    setShowMigrationModal(false);
    console.log('Migration complete:', results);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--fomz-body-bg)] text-[var(--fomz-surface-muted)]">
        Connecting to Fomz...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      
      {/* Global Migration Modal */}
      <MigrationModal 
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onComplete={handleMigrationComplete}
      />
    </ThemeProvider>
  );
};

export default App;
