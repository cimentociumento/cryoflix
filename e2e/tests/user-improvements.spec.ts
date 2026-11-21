import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken, prismaTest } from '../helpers/db';
import { submitLoginForm } from '../helpers/ui';

const movie = {
  id: 550, title: 'Filme de teste de preferências', overview: 'Catálogo controlado para o teste.',
  releaseDate: '2026-01-01', posterUrl: null, backdropPath: null, voteAverage: 8,
  genreIds: [], isHighRated: true,
};

async function createVerifiedUser(request: APIRequestContext) {
  const user = makeTestUser();
  const registered = await request.post('/api/auth/register', { data: user });
  expect(registered.status()).toBe(201);
  const token = await getEmailVerifyToken(user.email);
  const verified = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  expect(verified.ok()).toBeTruthy();
  return user;
}

async function openAccount(page: Page, user: { email: string; password: string; name: string }) {
  await page.goto('/account');
  await submitLoginForm(page, user);
  await expect(page.getByRole('heading', { name: user.name, exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // Apenas os metadados externos são simulados. Autenticação, perfil,
  // preferências, cookies e persistência usam a API e o PostgreSQL reais.
  await page.route('https://**/*', (route) => route.fulfill({ status: 204 }));
  await page.route((url) => url.pathname.startsWith('/api/metadata/'), async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      json: path.endsWith('/recommendations') ? [] : path === '/api/metadata/550' ? movie : [movie],
    });
  });
});

test('perfil válido é normalizado e persiste; nome só com espaços é recusado pela API e pela tela', async ({
  page, request,
}) => {
  const user = await createVerifiedUser(request);
  const login = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const invalid = await request.patch('/api/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { displayName: '   ' },
  });
  expect(invalid.status()).toBe(400);
  expect((await prismaTest.user.findUnique({ where: { email: user.email } })).displayName).toBe(user.name);

  await openAccount(page, user);
  const name = page.getByLabel('Nome de exibição');
  await name.fill('   ');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('O nome de exibição deve ter entre 1 e 120 caracteres.');
  await name.fill('  Ana Silva  ');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByText('Perfil atualizado!', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ana Silva', exact: true })).toBeVisible();
  await expect(name).toHaveValue('Ana Silva');
  expect((await prismaTest.user.findUnique({ where: { email: user.email } })).displayName).toBe('Ana Silva');
});

test('salvar idioma mantém filmes ocultados e histórico no PostgreSQL, inclusive após recarregar', async ({
  page, request,
}) => {
  const user = await createVerifiedUser(request);
  const history = [{ videoId: '550', watchedAt: '2026-11-20T12:00:00.000Z', progress: 1 }];
  await prismaTest.user.update({
    where: { email: user.email },
    data: { preferences: { language: 'pt-BR', theme: 'dark', __cf: { history } } },
  });
  await openAccount(page, user);
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await page.getByRole('button', { name: 'Não tenho interesse', exact: true }).click();
  await expect(page.getByText('Todos os filmes desta lista estão ocultos pelas suas preferências.')).toBeVisible();
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en-US');
  await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click();
  await expect(page.getByText('Preferências atualizadas!', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Idioma', exact: true })).toHaveValue('en-US');
  const saved = await prismaTest.user.findUnique({ where: { email: user.email } });
  expect(saved.preferences).toEqual({ language: 'en-US', theme: 'dark', hiddenMovieIds: [550], __cf: { history } });
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.getByText('Todos os filmes desta lista estão ocultos pelas suas preferências.')).toBeVisible();
  await expect(page.getByText(movie.title, { exact: true })).toHaveCount(0);
});
