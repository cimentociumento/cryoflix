import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { HomePage } from '../pages/Home/HomePage';
import { CatalogPage } from '../pages/Catalog/CatalogPage';
import { WatchPage } from '../pages/Watch/WatchPage';
import { AccountPage } from '../pages/Account/AccountPage';
import { SuperFlixPlayerPage } from '../pages/SuperFlixPlayer/SuperFlixPlayerPage';
import { VerifyEmailPage } from '../pages/VerifyEmail/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/ForgotPassword/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPassword/ResetPasswordPage';

export const AppRoutes = () => (
  <Routes>
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<AppLayout />}>
      <Route index element={<HomePage />} />
      <Route path="catalog" element={<CatalogPage />} />
      <Route path="watch/:videoId" element={<WatchPage />} />
      <Route path="account" element={<AccountPage />} />
    </Route>
    <Route path="player/superflix/:imdbId" element={<SuperFlixPlayerPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

