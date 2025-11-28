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

const App = () => {
  const { initializing } = useAuth();
  const { isAuthenticated, user } = useUserStore();
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

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
