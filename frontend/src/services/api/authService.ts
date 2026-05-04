import { httpClient } from '../../shared/api/httpClient';
import type { UserProfile } from '../../shared/types';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: Pick<UserProfile, 'id' | 'email' | 'name' | 'roles'>;
};

export const authService = {
  async register(payload: { email: string; password: string; name: string }) {
    return httpClient<{ user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async login(payload: { email: string; password: string }) {
    return httpClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async refresh(payload: { refreshToken: string }) {
    return httpClient<Omit<AuthResponse, 'user'>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

