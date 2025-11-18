import { useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../store/userStore';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logOut,
  resetPassword
} from '../services/userService';

let authListenerUnsubscribe = null;
let authListenerCount = 0;

export const useAuth = () => {
  const {
    user,
    setUser,
    clearUser,
    isAuthenticated,
    setLoading,
    loading,
    initializing,
    setInitializing
  } = useUserStore();

  useEffect(() => {
    authListenerCount += 1;

    if (authListenerCount === 1) {
      authListenerUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
        } else {
          clearUser();
        }
        setInitializing(false);
      });
    }

    return () => {
      authListenerCount -= 1;

      if (authListenerCount === 0 && authListenerUnsubscribe) {
        authListenerUnsubscribe();
        authListenerUnsubscribe = null;
        setInitializing(true);
      }
    };
  }, [setUser, clearUser, setInitializing]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signUp = useCallback(async (email, password, displayName) => {
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signInGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    await logOut();
    clearUser();
  }, [clearUser]);

  const forgotPassword = useCallback(async (email) => {
    await resetPassword(email);
  }, []);

  return useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    initializing,
    signIn,
    signUp,
    signInGoogle,
    logout,
    forgotPassword
  }), [user, loading, isAuthenticated, initializing, signIn, signUp, signInGoogle, logout, forgotPassword]);
};
