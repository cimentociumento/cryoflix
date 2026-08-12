import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectFormError,
} from '../helpers/ui';

test('cadastro, verificação de e-mail e login mostram o usuário autenticado', async ({
  page,
  request,
}) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  // AuthProvider.register tenta logar automaticamente após o cadastro;
  // a conta ainda não está verificada, então isso falha — comportamento
  // real do app, não um efeito colateral do teste.
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, user);

  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();
});
