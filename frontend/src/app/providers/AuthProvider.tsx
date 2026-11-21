import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService, userService } from '../../services/api';
import { tokenStore } from '../../shared/api/tokenStore';
import type { UserProfile } from '../../shared/types';

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await userService.getProfile();
      setUser(profile);
    } catch {
      // Sem access token válido em memória e sem cookie de refresh
      // aproveitável (httpClient já tentou renovar sozinho) — sem sessão.
      tokenStore.set(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Access token só existe na memória do processo — some a cada reload.
    // A tentativa abaixo dispara 401 se não houver token, e o httpClient
    // tenta renovar sozinho via cookie httpOnly antes de desistir; é assim
    // que a sessão sobrevive a um F5 sem token nenhum guardado no client.
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { accessToken } = await authService.login({ email, password });
    tokenStore.set(accessToken);
    await fetchProfile();
  }, [fetchProfile]);

  const register = useCallback(
    async ({ email, password, name }: { email: string; password: string; name: string }) => {
      await authService.register({ email, password, name });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Best-effort: mesmo se a chamada falhar, limpa o estado local.
    } finally {
      tokenStore.set(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const isAdmin = user?.role === 'ADMIN';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, loading, isAdmin, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

