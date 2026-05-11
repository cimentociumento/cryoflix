import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryCfg = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryCfg | undefined;
    if (!original || original._retry) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      useAuthStore.getState().setAccessToken(data.accessToken);
      if (!useAuthStore.getState().user) {
        const me = await axios.get(`${baseURL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        useAuthStore.getState().setUser(me.data);
      }
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);
