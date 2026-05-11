import { api } from './client';
import type { AdminUser, AuditLog, DashboardStats, PaginatedResponse } from '../types';

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
};
