import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { randomBytes } from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const backendPort = process.env.BACKEND_TEST_PORT ?? '4010';
const frontendPort = process.env.FRONTEND_TEST_PORT ?? '5183';
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../backend'),
      port: Number(backendPort),
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        NODE_ENV: 'test',
        PORT: backendPort,
        DATABASE_URL: testDatabaseUrl,
        REDIS_ENABLED: 'false',
        JWT_SECRET: randomBytes(32).toString('hex'),
        REFRESH_SECRET: randomBytes(32).toString('hex'),
        TMDB_API_KEY: '',
      },
    },
    {
      command: `npm run dev -- --port ${frontendPort} --strictPort`,
      cwd: path.resolve(__dirname, '../frontend'),
      port: Number(frontendPort),
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_API_PROXY_TARGET: `http://localhost:${backendPort}`,
        VITE_API_URL: '/api',
      },
    },
  ],
});
