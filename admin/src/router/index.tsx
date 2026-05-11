import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, PublicRoute } from './guards';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { UserDetailPage } from '../pages/users/UserDetailPage';
import { AuditLogPage } from '../pages/audit/AuditLogPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { AppShell } from '../components/layout/AppShell';

export const AppRouter = () => (
  <Routes>
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<AdminRoute />}>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
