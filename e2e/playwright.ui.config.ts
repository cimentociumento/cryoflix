import { defineConfig } from '@playwright/test';
import path from 'path';

// Testes de interface com respostas controladas; não acessam o banco nem APIs externas.
export default defineConfig({
  testDir: './tests/ui',
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:5183',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort',
      cwd: path.resolve(__dirname, '../frontend'),
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: false,
      env: { VITE_API_URL: '/api' },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5184 --strictPort',
      cwd: path.resolve(__dirname, '../admin'),
      url: 'http://127.0.0.1:5184',
      reuseExistingServer: false,
      env: { VITE_API_URL: '' },
    },
  ],
});
