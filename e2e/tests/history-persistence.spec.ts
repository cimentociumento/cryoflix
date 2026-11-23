import { test, expect, type APIRequestContext } from '@playwright/test';
import { fork, type ChildProcess } from 'child_process';
import { randomBytes } from 'crypto';
import path from 'path';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';

async function verifiedUser(request: APIRequestContext) {
  const user = makeTestUser();
  const response = await request.post('/api/auth/register', { data: user });
  expect(response.status()).toBe(201);
  const token = await getEmailVerifyToken(user.email);
  expect((await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)).ok()).toBeTruthy();
  return user;
}

async function login(request: APIRequestContext, user: { email: string; password: string }) {
  const response = await request.post('/api/auth/login', { data: user });
  expect(response.status()).toBe(200);
  return (await response.json()).accessToken as string;
}

async function startBackend(): Promise<ChildProcess> {
  const child = fork(path.resolve(__dirname, '../scripts/restartable-backend.cjs'), [], {
    cwd: path.resolve(__dirname, '../../backend'),
    execArgv: [],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      REDIS_ENABLED: 'false',
      PORT: '4011',
      JWT_SECRET: randomBytes(32).toString('hex'),
      REFRESH_SECRET: randomBytes(32).toString('hex'),
      TMDB_API_KEY: '',
    },
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('O backend de teste não iniciou dentro do prazo.'));
    }, 15_000);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Backend encerrou antes de iniciar (${code}).`)); });
    child.once('message', () => { clearTimeout(timer); resolve(); });
  });
  return child;
}

async function stopBackend(child: ChildProcess) {
  if (child.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => child.kill(), 5_000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.send('shutdown');
  });
}

test('ponto e histórico persistem após logout, novo login e reinício real do processo da API', async ({
  request, playwright,
}) => {
  test.setTimeout(60_000);
  const user = await verifiedUser(request);
  const api = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:4011' });
  let child: ChildProcess | undefined;
  try {
    child = await startBackend();
    let token = await login(api, user);
    const saved = await api.post('/api/player/progress', {
      headers: { Authorization: `Bearer ${token}` },
      data: { movieId: 550, progress: 0.35, timestamp: 126 },
    });
    expect(saved.status()).toBe(200);
    expect((await api.post('/api/auth/logout', {
      headers: { Authorization: `Bearer ${token}` }, data: {},
    })).ok()).toBeTruthy();
    token = await login(api, user);
    let response = await api.get('/api/player/550/progress', { headers: { Authorization: `Bearer ${token}` } });
    expect(await response.json()).toMatchObject({ movieId: 550, progress: 0.35, timestamp: 126 });

    await stopBackend(child);
    child = undefined;
    child = await startBackend();
    token = await login(api, user);
    response = await api.get('/api/player/550/progress', { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ movieId: 550, progress: 0.35, timestamp: 126 });
    const profile = await api.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
    expect((await profile.json()).history).toEqual(expect.arrayContaining([
      expect.objectContaining({ videoId: '550', progress: 0.35, timestamp: 126 }),
    ]));
  } finally {
    if (child) await stopBackend(child);
    await api.dispose();
  }
});

test('o ponto de um usuário permanece separado do progresso de outro', async ({ request }) => {
  const owner = await verifiedUser(request);
  const other = await verifiedUser(request);
  const tokenA = await login(request, owner);
  const tokenB = await login(request, other);
  expect((await request.post('/api/player/progress', {
    headers: { Authorization: `Bearer ${tokenA}` },
    data: { movieId: 680, progress: 0.5, timestamp: 300 },
  })).status()).toBe(200);
  const isolated = await request.get('/api/player/680/progress', { headers: { Authorization: `Bearer ${tokenB}` } });
  expect(await isolated.json()).toMatchObject({ movieId: 680, progress: 0, timestamp: 0 });
  const unauthorized = await request.get('/api/player/680/progress');
  expect(unauthorized.status()).toBe(401);
});

test('evento antigo não sobrescreve o ponto mais recente no PostgreSQL', async ({ request }) => {
  const user = await verifiedUser(request);
  const token = await login(request, user);
  const headers = { Authorization: `Bearer ${token}` };
  const latest = new Date(Date.now() - 2_000).toISOString();
  const older = new Date(Date.now() - 10_000).toISOString();
  expect((await request.post('/api/player/progress', {
    headers,
    data: { movieId: 42, timestamp: 360, progress: 0.6, recordedAt: latest },
  })).status()).toBe(200);
  expect((await request.post('/api/player/progress', {
    headers,
    data: { movieId: 42, timestamp: 60, progress: 0.1, recordedAt: older },
  })).status()).toBe(200);
  const response = await request.get('/api/player/42/progress', { headers });
  expect(await response.json()).toMatchObject({ movieId: 42, timestamp: 360, progress: 0.6 });
});
