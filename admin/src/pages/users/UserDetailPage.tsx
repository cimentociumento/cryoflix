import { useParams, Link } from 'react-router-dom';
import { useUserDetail, useUserMutations } from '../../hooks/useUsers';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import toast from 'react-hot-toast';

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useUserDetail(id);
  const { patchRole, patchStatus, remove } = useUserMutations();
  const audit = useAuditLogs({ page: 1, limit: 20, userId: id });

  if (isLoading || !data) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/users" className="text-sm text-[var(--color-cryo-accent)] hover:underline">
        ← Voltar
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{data.displayName ?? data.username}</h2>
          <p className="text-neutral-500">@{data.username}</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="rounded bg-white/10 px-2 py-0.5">{data.role}</span>
            <span className="rounded bg-white/10 px-2 py-0.5">{data.status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-neutral-600 px-3 py-1 text-xs"
            onClick={() =>
              void patchRole
                .mutateAsync({ id: data.id, role: data.role === 'ADMIN' ? 'USER' : 'ADMIN' })
                .then(() => toast.success('Role atualizado'))
                .catch(() => toast.error('Falha'))
            }
          >
            Alternar role
          </button>
          <button
            type="button"
            className="rounded border border-orange-700 px-3 py-1 text-xs text-orange-200"
            onClick={() =>
              void patchStatus
                .mutateAsync({ id: data.id, status: 'SUSPENDED' })
                .then(() => toast.success('Suspenso'))
                .catch(() => toast.error('Falha'))
            }
          >
            Suspender
          </button>
          <button
            type="button"
            className="rounded border border-red-800 px-3 py-1 text-xs text-red-300"
            onClick={() =>
              void remove
                .mutateAsync(data.id)
                .then(() => toast.success('Removido'))
                .catch(() => toast.error('Falha'))
            }
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] p-4 text-sm">
          <div>E-mail: {data.email}</div>
          <div className="mt-2">Verificado: {data.emailVerified ? 'sim' : 'não'}</div>
          <div className="mt-2">Cadastro: {new Date(data.createdAt).toLocaleString()}</div>
          <div className="mt-2">Último login: {data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString() : '—'}</div>
          <div className="mt-2">Tentativas falhas: {data.failedLoginAttempts}</div>
          <div className="mt-2">
            Bloqueado até: {data.lockedUntil ? new Date(data.lockedUntil).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-300">Auditoria recente</h3>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-cryo-border)]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-black/40 text-neutral-500">
              <tr>
                <th className="px-2 py-2">Quando</th>
                <th className="px-2 py-2">Ação</th>
                <th className="px-2 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.data?.data.map((a) => (
                <tr key={a.id} className="border-t border-[var(--color-cryo-border)]">
                  <td className="px-2 py-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-2">{a.action}</td>
                  <td className="px-2 py-2">{a.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
