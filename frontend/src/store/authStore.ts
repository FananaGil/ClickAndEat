import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, AuthState } from '@/types';
import * as authLib from '@/lib/auth';

interface AuthStore extends AuthState {
  setUser: (user: Usuario | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string, telefono: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: Usuario | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const state = await authLib.login(email, password);
          set({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, nombre: string, telefono: string) => {
        set({ isLoading: true });
        try {
          const state = await authLib.register(email, password, nombre, telefono);
          set({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authLib.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const state = await authLib.getCurrentSession();
          set({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'clickandeat-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper selectors
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectCurrentUser = (state: AuthStore) => state.user;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectUserType = (state: AuthStore) => state.user?.tipo;

// Helper to check if user has access to a specific role
export const selectHasRole = (requiredRole: 'usuario' | 'tienda' | 'admin') => (state: AuthStore) =>
  state.user?.tipo === requiredRole;
