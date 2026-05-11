import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const { user, accessToken, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  const isAuthenticated = Boolean(accessToken && user);
  const isAdmin = user?.role === 'ADMIN';

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await authApi.login(email, password);
        if (res.user.role !== 'ADMIN') {
          await authApi.logout().catch(() => undefined);
          clearAuth();
          throw new Error('Acesso restrito a administradores');
        }
        setAuth(res.user, res.accessToken);
        toast.success('Bem-vindo ao painel');
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    window.location.href = '/login';
  }, [clearAuth]);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isAdmin,
      isLoading,
      login,
      logout,
    }),
    [user, isAuthenticated, isAdmin, isLoading, login, logout],
  );
};
