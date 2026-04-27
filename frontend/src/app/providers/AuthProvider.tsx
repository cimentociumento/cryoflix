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
import type { UserProfile } from '../../shared/types';

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'fflix_access_token';
const REFRESH_TOKEN_KEY = 'fflix_refresh_token';

const persistTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await userService.getProfile();
      setUser(profile);
    } catch (error) {
      // Se o erro for 401 ou 404, limpa os tokens
      // Outros erros podem ser temporários
      if (error instanceof Error && error.message.includes('401')) {
        clearTokens();
        setUser(null);
      } else if (error instanceof Error && error.message.includes('404')) {
        // Usuário não encontrado - token pode ser inválido
        clearTokens();
        setUser(null);
      } else {
        // Outros erros - mantém token mas não define usuário
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [fetchProfile]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { accessToken, refreshToken } = await authService.login({ email, password });
    persistTokens(accessToken, refreshToken);
    await fetchProfile();
  }, [fetchProfile]);

  const register = useCallback(
    async ({ email, password, name }: { email: string; password: string; name: string }) => {
      await authService.register({ email, password, name });
      await login({ email, password });
    },
    [login],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, loading, login, register, logout, refreshProfile],
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

