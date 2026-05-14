import { create } from 'zustand';
import { User } from '../_types';
import { fetchCurrentUser } from '../_hooks/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  initializeAuth: async () => {
    // Load user from localStorage on app init
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          set({ isLoading: false });
        }
      } else {
        try {
          const result = await fetchCurrentUser(); // GET /auth/me, cookie sent automatically
          set({ user: result, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
        set({ isLoading: false });
      }
    }
  },
}));
