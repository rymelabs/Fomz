import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      initializing: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      clearUser: () => set({ user: null, isAuthenticated: false }),
      
      setLoading: (loading) => set({ loading }),

      setInitializing: (initializing) => set({ initializing }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'fomz-user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
