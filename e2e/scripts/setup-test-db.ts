import { execFileSync } from 'child_process';
import path from 'path';
import { Client } from 'pg';

const EXPECTED_DB_NAME = 'cryoflix_test';
const BACKEND_DIR = path.resolve(__dirname, '../../backend');

export function assertTestDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL não definido. Copie e2e/.env.test.example para e2e/.env.test.',
    );
  }
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (dbName !== EXPECTED_DB_NAME) {
    throw new Error(
      `TEST_DATABASE_URL aponta para o banco "${dbName}", não "${EXPECTED_DB_NAME}". ` +
        'Abortando para não rodar os testes em cima de um banco que não é de teste.',
    );
  }
  return url;
}

async function ensureDatabaseExists(testDatabaseUrl: string): Promise<void> {
  const target = new URL(testDatabaseUrl);
  const dbName = target.pathname.replace(/^\//, '');
  const maintenanceUrl = new URL(testDatabaseUrl);
  maintenanceUrl.pathname = '/postgres';

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
    }
  } finally {
    await client.end();
  }
}

function runPrismaGenerate(): void {
  execFileSync('npx', ['prisma', 'generate'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
}

function runMigrations(testDatabaseUrl: string): void {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'inherit',
    shell: true,
  });
}

async function truncateAllTables(testDatabaseUrl: string): Promise<void> {
  const client = new Client({ connectionString: testDatabaseUrl });
  await client.connect();
  try {
    await client.query(
      'TRUNCATE TABLE audit_logs, watch_progress, subscriptions, refresh_tokens, users RESTART IDENTITY CASCADE',
    );
  } finally {
    await client.end();
  }
}

export async function setupTestDatabase(rawUrl: string | undefined): Promise<void> {
  const testDatabaseUrl = assertTestDatabaseUrl(rawUrl);
  await ensureDatabaseExists(testDatabaseUrl);
  runPrismaGenerate();
  runMigrations(testDatabaseUrl);
  await truncateAllTables(testDatabaseUrl);
}
