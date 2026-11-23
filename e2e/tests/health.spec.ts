import { test, expect } from '@playwright/test';

test('backend de teste responde em /health', async ({ request }) => {
  const backendPort = process.env.BACKEND_TEST_PORT ?? '4010';
  const response = await request.get(`http://localhost:${backendPort}/health`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe('ok');
});

test('frontend de teste carrega a home com o formulário de login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entrar ou criar conta' })).toBeVisible();
});
