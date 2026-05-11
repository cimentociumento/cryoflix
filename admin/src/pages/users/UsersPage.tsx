import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUsersList, useUserMutations } from '../../hooks/useUsers';
import type { AccountStatus, Role } from '../../types';

export const UsersPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1');
  const limit = Number(params.get('limit') ?? '20');
  const search = params.get('search') ?? '';
  const role = (params.get('role') as Role | null) || undefined;
  const status = (params.get('status') as AccountStatus | null) || undefined;

  const [searchInput, setSearchInput] = useState(search);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    }),
    [page, limit, search, role, status],
  );

  const { data, isLoading } = useUsersList(queryParams);
  const { patchStatus, remove } = useUserMutations();

  const setFilter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setParams(next);
  };

  const applySearch = () => {
    const next = new URLSearchParams(params);
    if (searchInput) {
      next.set('search', searchInput);
    } else {
      next.delete('search');
    }
    next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-neutral-500">Busca</label>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={applySearch}
            className="mt-1 block rounded-md border border-[var(--color-cryo-border)] bg-black/30 px-2 py-1 text-sm"
            placeholder="E-mail ou username"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Role</label>
          <select
            className="mt-1 block rounded-md border border-[var(--color-cryo-border)] bg-black/30 px-2 py-1 text-sm"
            value={role ?? ''}
            onChange={(e) => setFilter('role', e.target.value || undefined)}
          >
            <option value="">Todos</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-500">Status</label>
          <select
            className="mt-1 block rounded-md border border-[var(--color-cryo-border)] bg-black/30 px-2 py-1 text-sm"
            value={status ?? ''}
            onChange={(e) => setFilter('status', e.target.value || undefined)}
          >
            <option value="">Todos</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BANNED">BANNED</option>
          </select>
        </div>
        <button
          type="button"
          className="rounded-md border border-neutral-600 px-3 py-1 text-xs"
          onClick={() => {
            setSearchInput('');
            setParams(new URLSearchParams());
          }}
        >
          Limpar filtros
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-cryo-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/40 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Usuário</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                  Carregando…
                </td>
              </tr>
            ) : null}
            {data?.data.map((u) => (
              <tr key={u.id} className="border-t border-[var(--color-cryo-border)]">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.displayName ?? u.username}</div>
                  <div className="text-xs text-neutral-500">@{u.username}</div>
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.status}</td>
                <td className="px-3 py-2">
                  <Link className="text-[var(--color-cryo-accent)] hover:underline" to={`/users/${u.id}`}>
                    Detalhes
                  </Link>
                  <button
                    type="button"
                    className="ml-3 text-xs text-orange-300 hover:underline"
                    onClick={() =>
                      void patchStatus
                        .mutateAsync({ id: u.id, status: 'SUSPENDED' })
                        .then(() => toast.success('Status atualizado'))
                        .catch(() => toast.error('Falha ao suspender'))
                    }
                  >
                    Suspender
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-xs text-red-400 hover:underline"
                    onClick={() =>
                      void remove
                        .mutateAsync(u.id)
                        .then(() => toast.success('Removido'))
                        .catch(() => toast.error('Falha ao remover'))
                    }
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 ? (
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded border border-neutral-600 px-2 py-1 disabled:opacity-40"
            onClick={() => {
              const n = new URLSearchParams(params);
              n.set('page', String(page - 1));
              setParams(n);
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= data.totalPages}
            className="rounded border border-neutral-600 px-2 py-1 disabled:opacity-40"
            onClick={() => {
              const n = new URLSearchParams(params);
              n.set('page', String(page + 1));
              setParams(n);
            }}
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
};
