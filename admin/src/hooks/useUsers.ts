import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useUsersList = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.users(params),
    refetchInterval: 60_000,
  });

export const useUserDetail = (id: string | undefined) =>
  useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminApi.user(id!),
    enabled: Boolean(id),
  });

export const useUserMutations = () => {
  const qc = useQueryClient();
  const invalidate = async (userId?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'audit'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
      ...(userId
        ? [qc.invalidateQueries({ queryKey: ['admin', 'user', userId], exact: true })]
        : []),
    ]);
  };

  const patchRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) => adminApi.patchRole(id, role),
    onSuccess: (_data, { id }) => invalidate(id),
  });
  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.patchStatus(id, status),
    onSuccess: (_data, { id }) => invalidate(id),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: async (_data, id) => {
      await invalidate();
      qc.removeQueries({ queryKey: ['admin', 'user', id], exact: true });
    },
  });

  return { patchRole, patchStatus, remove };
};
