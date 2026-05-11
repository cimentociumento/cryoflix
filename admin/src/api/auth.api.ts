import { api } from './client';
import type { AdminUser } from '../types';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout', {}).then((r) => r.data),
  me: () => api.get<AdminUser>('/auth/me').then((r) => r.data),
};
