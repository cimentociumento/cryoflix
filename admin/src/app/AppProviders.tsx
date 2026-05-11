import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [client] = useState(() => new QueryClient());

  useEffect(() => {
    void (async () => {
      useAuthStore.getState().setLoading(true);
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        useAuthStore.getState().setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        useAuthStore.getState().setUser(me);
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { background: '#101010', color: '#f0f0f0' } }} />
    </QueryClientProvider>
  );
};
