import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button/Button';
import { useAuth } from '../app/providers/AuthProvider';

const navItems = [
  { to: '/', label: 'Início' },
  { to: '/catalog', label: 'Catálogo' },
  { to: '/account', label: 'Minha conta' },
];

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-4">
        <div
          role="button"
          onClick={() => navigate('/')}
          className="cursor-pointer font-display text-xl font-semibold uppercase tracking-[0.08em] text-marquee"
        >
          CryoFlix
        </div>
        <nav className="flex flex-wrap gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `border-b-2 pb-1 text-sm font-medium transition-colors ${
                  isActive ? 'border-marquee text-bone' : 'border-transparent text-smoke hover:text-bone'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-velvet font-semibold text-bone">
                {user.name.charAt(0)}
              </span>
              <Button variant="secondary" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/account')}>Entrar</Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 pb-4 pt-6 text-center text-xs text-smoke">
        © {new Date().getFullYear()} CryoFlix Streaming
      </footer>
    </div>
  );
};

