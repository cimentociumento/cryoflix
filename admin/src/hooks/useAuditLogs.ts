import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAuditLogs = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: () => adminApi.auditLogs(params),
  });
