import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ScrollText, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/audit', label: 'Auditoria', icon: ScrollText },
];

export const AppShell = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const title =
    nav.find((n) => pathname.startsWith(n.to))?.label ??
    (pathname.startsWith('/users/') ? 'Detalhe do usuário' : 'CryoFlix Admin');

  return (
    <div className="flex min-h-screen bg-[var(--color-cryo-bg)] text-neutral-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-[var(--color-cryo-border)] px-4 py-5">
          <div className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--color-cryo-accent)]">
            CryoFlix Admin
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'border-l-2 border-[var(--color-cryo-accent)] bg-white/5 text-[var(--color-cryo-accent)]'
                    : 'text-neutral-300 hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--color-cryo-border)] p-3">
          <div className="mb-2 truncate text-xs text-neutral-500">{user?.email}</div>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="flex items-center justify-between border-b border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 hover:bg-white/5 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--color-cryo-border)] px-3 py-1 text-xs"
            onClick={() => navigate('/dashboard')}
          >
            {user?.displayName ?? user?.username}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
