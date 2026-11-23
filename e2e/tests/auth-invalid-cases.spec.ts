import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectFormError,
} from '../helpers/ui';

test('login antes de verificar o e-mail mostra o erro correto', async ({ page }) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  // Tentativa explícita de login (caminho de código diferente do
  // auto-login disparado pelo cadastro) — a conta continua não verificada.
  // A mensagem de erro é idêntica à do auto-login, então esperar a resposta
  // de rede do POST /api/auth/login (em vez de só o texto na tela) prova que
  // essa segunda tentativa realmente disparou, e não é o erro anterior parado
  // na tela.
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
  // Aguarda a tentativa de auto-login falhar para garantir que o token está
  // disponível no banco antes de tentar obtê-lo.
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, { email: user.email, password: 'SenhaErrada1!' });

  await expectFormError(page, 'Credenciais inválidas');
});
