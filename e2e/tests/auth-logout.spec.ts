import { test, expect, type Page } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import { submitRegisterForm, switchToLoginMode, submitLoginForm, expectFormError } from '../helpers/ui';

const getRefreshCookie = async (page: Page) => {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === 'cryoflix_refresh');
};

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

  // Login seta o cookie de refresh httpOnly; espera aparecer no contexto do
  // browser antes de seguir (evita corrida entre o Set-Cookie da resposta e
  // a leitura via CDP logo em seguida).
  await expect.poll(() => getRefreshCookie(page)).toBeDefined();

  await page.getByRole('button', { name: 'Sair' }).click();

  await expect(page.getByRole('heading', { name: 'Entrar ou criar conta' })).toBeVisible();

  // Access token vive só em memória — não há mais o que checar em
  // localStorage. O que prova que a sessão foi de fato encerrada no
  // servidor (não só escondida no client) é o cookie de refresh ter sido
  // limpo e parar de funcionar depois do logout.
  await expect.poll(() => getRefreshCookie(page)).toBeUndefined();

  const refreshAfter = await page.request.post('/api/auth/refresh', { data: {} });
  expect(refreshAfter.ok()).toBeFalsy();
});
