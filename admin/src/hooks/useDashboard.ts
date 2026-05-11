import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
    staleTime: 30_000,
  });
