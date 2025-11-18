import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/global.css';
import { useAuth } from './hooks/useAuth';
import ThemeProvider from './components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { initializing } = useAuth();

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
    </ThemeProvider>
  );
};

export default App;
