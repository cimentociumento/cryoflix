import { Page, expect } from '@playwright/test';
import type { TestUser } from './testUser';

// AppLayout também renderiza um botão "Entrar" no header (navega para
// /account) sempre que !user — o mesmo texto do toggle do LoginForm. Por
// isso os toggles são localizados dentro de `.login-form_toggle`, nunca
// pelo texto sozinho, para não colidir com o botão do header.
const loginFormToggle = (page: Page) => page.locator('.login-form_toggle');

export async function switchToRegisterMode(page: Page): Promise<void> {
  await loginFormToggle(page).getByRole('button', { name: 'Criar conta' }).click();
}

export async function switchToLoginMode(page: Page): Promise<void> {
  await loginFormToggle(page).getByRole('button', { name: 'Entrar', exact: true }).click();
}

export async function submitRegisterForm(page: Page, user: TestUser): Promise<void> {
  await switchToRegisterMode(page);
  await page.getByLabel('Nome').fill(user.name);
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);
  await page.locator('button[type="submit"]').click();
}

export async function submitLoginForm(
  page: Page,
  user: Pick<TestUser, 'email' | 'password'>,
): Promise<void> {
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);
  await page.locator('button[type="submit"]').click();
}

export async function expectFormError(page: Page, text: string): Promise<void> {
  await expect(page.locator('.status.error')).toHaveText(text);
}
