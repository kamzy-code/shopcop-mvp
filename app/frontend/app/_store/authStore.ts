import { create } from 'zustand';
import { User } from '../_types';
import { fetchCurrentUser } from '../_hooks/auth';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  revalidateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isSessionReady: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isSessionReady: true,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isSessionReady: true,
        }),

      revalidateSession: async () => {
        try {
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true, isSessionReady: true });
        } catch {
          // Cookie expired or invalid — clear stale localStorage
          set({ user: null, isAuthenticated: false, isSessionReady: true });
        } finally {
          set({ isSessionReady: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      merge: (persistedState, currentState) => {
        const { user } = persistedState as { user: User | null };
        return {
          ...currentState,
          user: user ?? null,
          isAuthenticated: !!user,
          isSessionReady: false,
        };
      },
    }
  )
);
