import { api } from './client';
import type {
  AdminUser,
  AuditLog,
  BlockedMovie,
  DashboardStats,
  MovieSearchResult,
  PaginatedResponse,
} from '../types';

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
  users: (params: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<AdminUser>>('/admin/users', { params }).then((r) => r.data),
  user: (id: string) => api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),
  patchRole: (id: string, role: 'USER' | 'ADMIN') =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  patchStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  auditLogs: (params: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params }).then((r) => r.data),
  blockedMovies: () => api.get<BlockedMovie[]>('/admin/blocked-movies').then((r) => r.data),
  blockMovie: (payload: { tmdbId: number; title: string; posterPath?: string | null; reason?: string }) =>
    api.post<BlockedMovie>('/admin/blocked-movies', payload).then((r) => r.data),
  unblockMovie: (tmdbId: number) => api.delete(`/admin/blocked-movies/${tmdbId}`),
  searchMovies: (query: string) =>
    api.get<MovieSearchResult[]>('/metadata/search', { params: { query } }).then((r) => r.data),
};
