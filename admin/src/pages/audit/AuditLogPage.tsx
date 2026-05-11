import { useSearchParams } from 'react-router-dom';
import { useAuditLogs } from '../../hooks/useAuditLogs';

export const AuditLogPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1');
  const action = params.get('action') ?? undefined;

  const { data, isLoading } = useAuditLogs({ page, limit: 25, action });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-[var(--color-cryo-border)] bg-black/30 px-2 py-1 text-sm"
          value={action ?? ''}
          onChange={(e) => {
            const n = new URLSearchParams(params);
            if (e.target.value) {
              n.set('action', e.target.value);
            } else {
              n.delete('action');
            }
            n.set('page', '1');
            setParams(n);
          }}
        >
          <option value="">Todas ações</option>
          <option value="LOGIN">LOGIN</option>
          <option value="REGISTER">REGISTER</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="ROLE_CHANGE">ROLE_CHANGE</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE</option>
          <option value="USER_DELETE">USER_DELETE</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-cryo-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/40 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Usuário</th>
              <th className="px-3 py-2">Ação</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">
                  Carregando…
                </td>
              </tr>
            ) : null}
            {data?.data.map((row) => (
              <tr key={row.id} className="border-t border-[var(--color-cryo-border)]">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-3 py-2">{row.userEmail ?? row.username ?? '—'}</td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="px-3 py-2">{row.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
