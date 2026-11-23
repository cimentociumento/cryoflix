import { test, expect } from '@playwright/test';
import path from 'path';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken, prismaTest } from '../helpers/db';
import { submitLoginForm } from '../helpers/ui';

const videoPath = path.resolve(__dirname, '../fixtures/flower.mp4');
const movie = {
  id: 550, title: 'Teste de retomada do player', overview: 'Dados de catálogo controlados.',
  releaseDate: '2026-01-01', posterUrl: null, backdropPath: null,
  voteAverage: 8, genreIds: [], isHighRated: true, imdbId: 'tt0137523',
};

test('vídeo local salva a posição real e retoma o mesmo ponto após sair e entrar novamente', async ({
  page, request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', (route) => route.fulfill({ status: 204 }));
  await page.route((url) => url.pathname.startsWith('/api/metadata/'), async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    await route.fulfill({ json: pathname === '/api/metadata/550' ? movie : pathname.endsWith('/recommendations') ? [] : [movie] });
  });
  // As dependências de catálogo/legenda não interferem no teste. Autenticação,
  // gravação do progresso e consultas ao PostgreSQL permanecem reais.
  await page.route((url) => url.pathname.startsWith('/api/subtitles'), (route) => route.fulfill({ json: [] }));
  await page.route((url) => url.pathname === '/api/player/550/embed', (route) => route.fulfill({
    json: { movieId: 550, embedUrl: 'https://multiembed.mov/?video_id=550&tmdb=1', quality: '1080p' },
  }));
  const user = makeTestUser();
  expect((await request.post('/api/auth/register', { data: user })).status()).toBe(201);
  const token = await getEmailVerifyToken(user.email);
  expect((await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)).ok()).toBeTruthy();

  await page.goto('/account');
  await submitLoginForm(page, user);
  await expect(page.getByRole('heading', { name: user.name, exact: true })).toBeVisible();
  await page.goto('/watch/550');
  await expect(page.getByLabel('Abrir vídeo do dispositivo')).toBeEnabled();
  await page.getByLabel('Abrir vídeo do dispositivo').setInputFiles(videoPath);
  const video = page.getByLabel('Player de vídeo local', { exact: true });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => Number.isFinite(element.duration) && element.duration > 2)).toBe(true);
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true;
    await element.play();
  });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(1);
  await video.evaluate((element: HTMLVideoElement) => element.pause());

  await expect.poll(async () => {
    const row = await prismaTest.watchProgress.findFirst({ where: { user: { email: user.email }, movieId: '550' } });
    return row?.timestamp ?? 0;
  }).toBeGreaterThanOrEqual(1);
  await expect(page.getByText('Salvando ponto de reprodução...', { exact: true })).toHaveCount(0);
  const row = await prismaTest.watchProgress.findFirst({ where: { user: { email: user.email }, movieId: '550' } });
  const savedTimestamp = row.timestamp as number;
  expect(row.progress).toBeGreaterThan(0);
  expect(row.progress).toBeLessThan(100);

  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Faça login para assistir' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await submitLoginForm(page, user);
  await expect(page.getByRole('heading', { name: user.name, exact: true })).toBeVisible();
  await page.goto('/watch/550');
  await expect(page.getByLabel('Abrir vídeo do dispositivo')).toBeEnabled();
  await page.getByLabel('Abrir vídeo do dispositivo').setInputFiles(videoPath);
  const resumed = page.getByLabel('Player de vídeo local', { exact: true });
  await expect.poll(() => resumed.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(savedTimestamp, 0);
  await expect(page.getByText('Último ponto salvo:', { exact: false })).toBeVisible();
  const after = await prismaTest.watchProgress.findFirst({ where: { user: { email: user.email }, movieId: '550' } });
  expect(after.timestamp).toBe(savedTimestamp);
  expect(after.progress).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
