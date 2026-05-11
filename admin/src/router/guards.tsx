import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Spinner = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-cryo-accent)] border-t-transparent" />
  </div>
);

export const PublicRoute = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return <Spinner />;
  }
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-cryo-accent)]">
          Acesso negado
        </h1>
        <p className="mt-2 text-neutral-400">Sua conta não possui permissão de administrador.</p>
      </div>
    );
  }
  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return <Spinner />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};
