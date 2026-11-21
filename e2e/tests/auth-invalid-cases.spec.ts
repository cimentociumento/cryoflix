import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectFormError,
  expectRegistrationSuccess,
} from '../helpers/ui';

test('login antes de verificar o e-mail mostra o erro correto', async ({ page }) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  await expectRegistrationSuccess(page);

  // A conta existe, mas o login continua bloqueado até verificar o e-mail.
  await switchToLoginMode(page);
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.request().method() === 'POST',
    ),
    submitLoginForm(page, user),
  ]);
  expect(loginResponse.status()).toBe(401);
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');
});

test('login com senha errada em conta verificada mostra credenciais inválidas', async ({
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
  await submitLoginForm(page, { email: user.email, password: 'SenhaErrada1!' });

  await expectFormError(page, 'Credenciais inválidas');
});
