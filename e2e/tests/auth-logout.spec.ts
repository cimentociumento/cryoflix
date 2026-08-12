import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import { submitRegisterForm, switchToLoginMode, submitLoginForm, expectFormError } from '../helpers/ui';

test('logout limpa a sessão e volta ao formulário de login', async ({ page, request }) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  // Aguarda a tentativa de auto-login falhar para garantir que o token está
  // disponível no banco antes de tentar obtê-lo.
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, user);
  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();

  await expect(page.getByRole('heading', { name: 'Entrar ou criar conta' })).toBeVisible();
  const storedToken = await page.evaluate(() => localStorage.getItem('fflix_access_token'));
  expect(storedToken).toBeNull();
});
