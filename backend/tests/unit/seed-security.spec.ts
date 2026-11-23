import { spawnSync } from 'child_process';
import path from 'path';

describe('Criação explícita do administrador', () => {
  it.each([
    ['', '', 'Defina ADMIN_EMAIL'],
    ['admin@example.test', '', 'Defina ADMIN_PASSWORD'],
    ['admin@example.test', 'short', 'Defina ADMIN_PASSWORD'],
  ])('recusa credenciais ausentes/fracas antes de acessar o banco', (email, password, message) => {
    const run = spawnSync(process.execPath, ['-r', 'ts-node/register/transpile-only', 'prisma/seed.ts'], {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', ADMIN_EMAIL: email, ADMIN_PASSWORD: password },
      encoding: 'utf8',
      timeout: 15_000,
      windowsHide: true,
    });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(message);
    expect(run.stderr).not.toContain('PrismaClientInitializationError');
  });
});
