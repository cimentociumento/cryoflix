import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectRegistrationSuccess,
} from '../helpers/ui';

test('cadastro, verificação de e-mail e login mostram o usuário autenticado', async ({
  page,
  request,
}) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  await expectRegistrationSuccess(page);

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, user);

  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();
});

test('sessão sobrevive a um reload sem token nenhum guardado no client', async ({
  page,
  request,
}) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  await expectRegistrationSuccess(page);

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, user);
  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();

  // Access token vive só em memória do processo da página — um reload
  // recarrega o JS do zero e perde ele. A sessão só sobrevive se o
  // AuthProvider conseguir renovar sozinho via cookie httpOnly no boot.
  await page.reload();

  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();
});
