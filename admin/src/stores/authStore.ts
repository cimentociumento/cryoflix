import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AdminUser } from '../types';

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  isLoading: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setUser: (user: AdminUser | null) => void;
  setLoading: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isLoading: true,
      setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'cryo_admin_token',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    },
  ),
);
