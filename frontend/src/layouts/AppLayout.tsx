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
    <div className="app-container">
      <header className="app-header">
        <div className="logo" role="button" onClick={() => navigate('/')}>
          CryoFlix
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-badge">{user.name.charAt(0)}</span>
              <Button variant="secondary" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/account')}>Entrar</Button>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="app-footer">
        <small>© {new Date().getFullYear()} CryoFlix Streaming</small>
      </footer>
    </div>
  );
};

