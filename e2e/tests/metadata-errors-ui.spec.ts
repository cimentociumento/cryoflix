import { test as base, expect } from '@playwright/test';

type ResponseMode = 'success' | 'empty' | 'unavailable' | 'missing';
type MetadataFixture = {
  trending: ResponseMode;
  search: ResponseMode;
  details: ResponseMode;
  requests: number;
};

const movie = {
  id: 550,
  title: 'Filme do catálogo de teste',
  overview: 'Metadados controlados para verificar a interface.',
  releaseDate: '2026-01-01',
  posterUrl: null,
  backdropPath: null,
  voteAverage: 8,
  genreIds: [],
  isHighRated: true,
};

const test = base.extend<{ metadata: MetadataFixture }>({
  metadata: async ({ page }, use) => {
    const state: MetadataFixture = { trending: 'success', search: 'success', details: 'success', requests: 0 };
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.route('https://**/*', (route) => route.fulfill({ status: 204 }));
    // Somente a integração externa de filmes é controlada. Login e sessão
    // continuam usando a API real do ambiente PostgreSQL de teste.
    await page.route((url) => url.pathname.startsWith('/api/metadata/'), async (route) => {
      state.requests += 1;
      const path = new URL(route.request().url()).pathname;
      const list = path === '/api/metadata/trending' || path === '/api/metadata/search';
      const mode = path === '/api/metadata/trending'
        ? state.trending
        : path === '/api/metadata/search'
          ? state.search
          : state.details;
      if (mode === 'unavailable') {
        await route.fulfill({ status: 503, json: { message: 'O serviço de filmes está indisponível.' } });
      } else if (mode === 'missing') {
        await route.fulfill({ status: 404, json: { message: 'Filme não encontrado.' } });
      } else {
        await route.fulfill({ json: list ? mode === 'empty' ? [] : [movie] : movie });
      }
    });
    await use(state);
    expect(pageErrors, 'A aplicação deve tratar a falha sem exceções no navegador.').toEqual([]);
  },
});

test('catálogo apresenta indisponibilidade e recupera os filmes pela nova tentativa', async ({ page, metadata }) => {
  metadata.trending = 'unavailable';
  await page.goto('/catalog');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o catálogo.');
  await expect(page.getByText('Nenhum filme disponível no momento.', { exact: true })).toHaveCount(0);
  metadata.trending = 'success';
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('busca sem resultados e falha de busca possuem mensagens diferentes', async ({ page, metadata }) => {
  await page.goto('/catalog');
  const input = page.getByPlaceholder('Buscar filmes (ex: Inception, Matrix)');
  metadata.search = 'empty';
  await input.fill('sem-resultados');
  await expect(page.getByText('Nenhum filme encontrado. Tente outra busca.', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);

  metadata.search = 'unavailable';
  await input.fill('falha-controlada');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o catálogo.');
  await expect(page.getByText('Nenhum filme encontrado. Tente outra busca.', { exact: true })).toHaveCount(0);
  metadata.search = 'success';
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
});

test('falha ao atualizar conserva os resultados anteriores e informa a indisponibilidade', async ({ page, metadata }) => {
  await page.goto('/catalog');
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  metadata.trending = 'unavailable';
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Os últimos resultados continuam abaixo.');
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
});

test('página inicial apresenta erro dos filmes em alta e permite recuperar a consulta', async ({ page, metadata }) => {
  metadata.trending = 'unavailable';
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os filmes em alta.');
  await expect(page.getByText('Nenhum filme disponível no momento.', { exact: true })).toHaveCount(0);
  metadata.trending = 'success';
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByText(movie.title, { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('identificador inexistente informa filme não encontrado e oferece retorno ao catálogo', async ({ page, metadata }) => {
  metadata.details = 'missing';
  await page.goto('/watch/99999991');
  await expect(page.getByRole('alert')).toContainText('Filme não encontrado.');
  await expect(page.getByRole('button', { name: 'Tentar carregar filme novamente' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Voltar ao catálogo', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test('indisponibilidade dos detalhes oferece nova tentativa sem afirmar filme inexistente', async ({ page, metadata }) => {
  metadata.details = 'unavailable';
  await page.goto('/watch/99999992');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os dados do filme.');
  await expect(page.getByText('Filme não encontrado.', { exact: true })).toHaveCount(0);
  const firstRequests = metadata.requests;
  metadata.details = 'missing';
  await page.getByRole('button', { name: 'Tentar carregar filme novamente', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Filme não encontrado.');
  expect(metadata.requests).toBeGreaterThan(firstRequests);
});
