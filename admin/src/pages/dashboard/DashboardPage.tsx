import { useDashboard } from '../../hooks/useDashboard';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const DashboardPage = () => {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return <p className="text-neutral-400">Carregando métricas…</p>;
  }
  if (isError || !data) {
    return <p className="text-red-400">Não foi possível carregar o painel.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total de usuários', data.totalUsers],
          ['Ativos', data.activeUsers],
          ['Novos hoje', data.newUsersToday],
          ['Suspensos / banidos', data.suspendedOrBanned],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] p-4"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-cryo-accent)]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] p-4">
        <h2 className="mb-4 text-sm font-semibold text-neutral-300">Novos cadastros (30 dias)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.newUsersLast30Days}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#101010', border: '1px solid #202020', borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="count" stroke="#00d4ff" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
