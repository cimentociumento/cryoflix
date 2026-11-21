import { test, expect, type Page } from '@playwright/test';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectRegistrationSuccess,
  expectFormError,
} from '../../helpers/ui';

const movie = {
  id: 550,
  title: 'Filme de demonstração',
  overview: 'Um filme para testar o catálogo.',
  releaseDate: '2026-01-01',
  posterUrl: null,
  backdropPath: null,
  voteAverage: 8,
  genreIds: [],
  isHighRated: true,
};

async function mockApi(page: Page, authenticated = false) {
  const state = {
    authenticated,
    verified: false,
    registerCalls: 0,
    loginCalls: 0,
    profileWrites: 0,
    catalogFails: false,
    hideFails: false,
    registrationFails: false,
    profileFails: false,
    submittedName: '',
    user: {
      id: 'viewer-test', email: 'ana@example.com', username: 'ana', name: 'Ana Silva',
      displayName: 'Ana Silva', bio: '', role: 'USER', roles: ['viewer'],
      preferences: { language: 'pt-BR', theme: 'dark' } as Record<string, unknown>,
      history: [],
    },
  };

  await page.route('https://**/*', (route) => route.fulfill({ status: 204 }));
  await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const send = (json: unknown, status = 200) => route.fulfill({ status, json });
    if (url.pathname === '/api/auth/register') {
      state.registerCalls += 1;
      state.submittedName = req.postDataJSON().name;
      return state.registrationFails
        ? send({ message: 'Usuário já existe' }, 409)
        : send({ user: state.user }, 201);
    }
    if (url.pathname === '/api/auth/login') {
      state.loginCalls += 1;
      if (!state.verified) return send({ message: 'Verifique seu e-mail antes de fazer login.' }, 401);
      state.authenticated = true;
      return send({ accessToken: 'test-token', user: state.user });
    }
    if (url.pathname === '/api/auth/refresh') return send({ message: 'Sem sessão' }, 400);
    if (url.pathname === '/api/users/me') {
      return state.authenticated ? send(state.user) : send({ message: 'Não autenticado' }, 401);
    }
    if (url.pathname === '/api/users/me/profile') {
      state.profileWrites += 1;
      if (state.profileFails) return send({ message: 'Não foi possível salvar o perfil.' }, 500);
      const { displayName, bio } = req.postDataJSON();
      Object.assign(state.user, { displayName, name: displayName, bio });
      return send(state.user);
    }
    if (url.pathname === '/api/users/me/preferences') {
      if (state.hideFails) return send({ message: 'Não foi possível salvar.' }, 500);
      Object.assign(state.user.preferences, req.postDataJSON().preferences);
      return send(state.user);
    }
    if (url.pathname.endsWith('/history')) return send({ history: [] });
    if (url.pathname === '/api/metadata/search' || url.pathname === '/api/metadata/trending') {
      if (state.catalogFails) return send({ message: 'Serviço indisponível' }, 503);
      return send(url.searchParams.get('query') === 'sem-resultados' ? [] : [movie]);
    }
    return send({ message: `Rota de teste não prevista: ${url.pathname}` }, 404);
  });
  return state;
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.clear());
  // Verifica exceções de JavaScript, além dos resultados visuais de cada cenário.
  (page as Page & { runtimeErrors?: string[] }).runtimeErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { runtimeErrors?: string[] }).runtimeErrors).toEqual([]);
});

test('cadastro mostra sucesso sem login automático e mantém a confirmação obrigatória', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/account');
  await submitRegisterForm(page, { name: '  Ana Silva  ', email: 'ana@example.com', password: 'SenhaForte1!' });
  await expectRegistrationSuccess(page);
  expect(state.submittedName).toBe('Ana Silva');
  expect(state.registerCalls).toBe(1);
  expect(state.loginCalls).toBe(0);

  await switchToLoginMode(page);
  await expect(page.locator('.status.success')).toHaveCount(0);
  await submitLoginForm(page, { email: 'ana@example.com', password: 'SenhaForte1!' });
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');
  state.verified = true;
  await submitLoginForm(page, { email: 'ana@example.com', password: 'SenhaForte1!' });
  await expect(page.getByRole('heading', { name: 'Ana Silva', exact: true })).toBeVisible();
});

test('cadastro rejeita nome só com espaços e apresenta falha devolvida pelo servidor', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/account');
  await submitRegisterForm(page, { name: '   ', email: 'ana@example.com', password: 'SenhaForte1!' });
  await expectFormError(page, 'O nome deve ter entre 2 e 120 caracteres.');
  expect(state.registerCalls).toBe(0);

  state.registrationFails = true;
  await page.getByLabel('Nome', { exact: true }).fill('Ana Silva');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expectFormError(page, 'Usuário já existe');
  expect(state.loginCalls).toBe(0);
  await expect(page.getByRole('button', { name: 'Registrar', exact: true })).toBeEnabled();
});

test('perfil recusa espaços, normaliza nome válido e mostra falha ao salvar', async ({ page }) => {
  const state = await mockApi(page, true);
  await page.goto('/account');
  const name = page.getByLabel('Nome de exibição');
  await name.fill('   ');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('O nome de exibição deve ter entre 1 e 120 caracteres.');
  expect(state.profileWrites).toBe(0);
  await expect(page.getByRole('heading', { name: 'Ana Silva', exact: true })).toBeVisible();

  await name.fill('  Maria Silva  ');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByText('Perfil atualizado!', { exact: true })).toBeVisible();
  await expect(name).toHaveValue('Maria Silva');
  await expect(page.getByRole('heading', { name: 'Maria Silva', exact: true })).toBeVisible();
  state.profileFails = true;
  await name.fill('Outro nome');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Não foi possível salvar o perfil.');
  await expect(page.getByText('Perfil atualizado!', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Maria Silva', exact: true })).toBeVisible();
});

test('catálogo distingue falha de lista vazia e permite tentar novamente', async ({ page }) => {
  const state = await mockApi(page);
  state.catalogFails = true;
  await page.goto('/catalog');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o catálogo.');
  await expect(page.getByText('Nenhum filme encontrado. Tente outra busca.', { exact: true })).toHaveCount(0);
  state.catalogFails = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByPlaceholder('Buscar filmes (ex: Inception, Matrix)').fill('sem-resultados');
  await expect(page.getByText('Nenhum filme encontrado. Tente outra busca.', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('falha ao atualizar preserva os filmes já carregados', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/catalog');
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  state.catalogFails = true;
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Os últimos resultados continuam abaixo.');
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  state.catalogFails = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('ocultar filme persiste na interface após salvar idioma e recarregar', async ({ page }) => {
  const state = await mockApi(page, true);
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Não tenho interesse', exact: true }).click();
  await expect(page.getByText('Todos os filmes desta lista estão ocultos pelas suas preferências.')).toBeVisible();
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en-US');
  await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click();
  await expect(page.getByText('Preferências atualizadas!', { exact: true })).toBeVisible();
  expect(state.user.preferences.hiddenMovieIds).toEqual([550]);
  expect(state.user.preferences.language).toBe('en-US');
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await page.reload();
  await expect(page.getByText('Todos os filmes desta lista estão ocultos pelas suas preferências.')).toBeVisible();
  await expect(page.getByText(movie.title, { exact: true })).toHaveCount(0);
});

test('falha ao ocultar filme mostra erro e permite nova tentativa', async ({ page }) => {
  const state = await mockApi(page, true);
  state.hideFails = true;
  await page.goto('/catalog');
  await page.getByRole('button', { name: 'Não tenho interesse', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar sua preferência.');
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  state.hideFails = false;
  await page.getByRole('button', { name: 'Não tenho interesse', exact: true }).click();
  await expect(page.getByText('Todos os filmes desta lista estão ocultos pelas suas preferências.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
