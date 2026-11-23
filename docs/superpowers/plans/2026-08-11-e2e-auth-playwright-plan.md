# Fase 2 — E2E de autenticação com Playwright — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma suíte Playwright que exercita, ponta a ponta, os fluxos de
cadastro/login/logout/refresh reais do app (`frontend/` + `backend/`), rodando
contra um banco de dados de teste isolado (`cryoflix_test`) que nunca pode ser
confundido com o banco de dev (`cryoflix`).

**Architecture:** Projeto npm próprio em `e2e/` (terceiro "app" do monorepo,
igual a `backend/`/`frontend/`, sem workspaces). `playwright.config.ts` sobe
backend e frontend automaticamente em portas isoladas (4010/5183) antes da
suíte, aponta o backend para `cryoflix_test` via env, e um `globalSetup`
cria/migra/limpa esse banco — abortando com erro se a URL resolvida não for
exatamente `cryoflix_test`. Os testes de cadastro/login/logout dirigem o
navegador de verdade contra o `LoginForm` existente; o de refresh bate direto
na API (não há UI para isso hoje). Um helper Prisma lê o `emailVerifyToken`
direto do banco de teste, já que o backend não envia e-mail em `NODE_ENV=test`.

**Tech Stack:** `@playwright/test`, `pg` (bootstrap do banco), `dotenv`,
`typescript` — todas já usadas em algum lugar do repo (backend usa `pg`-like
via Prisma, `dotenv`, `typescript`); único acréscimo novo é `@playwright/test`,
que é o próprio objetivo desta fase, já aprovado.

## Global Constraints

- O Postgres de `docker-compose.yml` (serviço `postgres`, container
  `cryoflix-postgres`, usuário e senha definidos no `.env` local, banco
  `cryoflix`) precisa estar rodando (`docker compose up -d postgres` na raiz)
  antes de qualquer tarefa que toque o banco de teste (Tasks 3+). O host
  expõe a porta em **5433**, não 5432 — nesta máquina de dev já existe um
  Postgres nativo (serviço Windows) ocupando 5432; `docker-compose.yml` foi
  ajustado (`ports: ["5433:5432"]`) para não colidir com ele. Nunca assumir
  a porta 5432 nos comandos abaixo.
- Backend `node_modules` precisa já estar instalado (`cd backend && npm install`)
  — as tarefas abaixo não reinstalam dependências do backend/frontend, só as
  de `e2e/`.
- Nunca commitar `e2e/.env.test` (segue o mesmo padrão de `.env` do repo:
  arquivo `.example` vai pro git, o real não).
- `e2e/` é um projeto npm independente, sem workspace — imports cruzados para
  `backend/` usam caminho relativo (`../../backend/...`), igual o resto do
  repo já faz implicitamente ao rodar cada app isolado.
- Todo texto de asserção nos testes de UI deve casar exatamente com o texto
  hoje renderizado pelo `LoginForm`/`AppLayout` — não inventar textos.

---

### Task 1: Scaffold do projeto `e2e/`

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/tsconfig.json`
- Create: `e2e/.env.test.example`
- Modify: `.gitignore` (raiz)

**Interfaces:**
- Produces: projeto `e2e/` instalável com `@playwright/test`, `pg`, `dotenv`,
  `typescript`, `@types/pg`, `@types/node` como devDependencies; scripts
  `test:e2e` e `typecheck`.

- [ ] **Step 1: Criar `e2e/package.json`**

```json
{
  "name": "e2e",
  "private": true,
  "version": "1.0.0",
  "description": "Testes E2E do CryoFlix (Playwright) — fluxos de autenticação",
  "scripts": {
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@types/node": "^24.10.1",
    "@types/pg": "^8.11.6",
    "dotenv": "^17.2.3",
    "pg": "^8.23.0",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Criar `e2e/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `e2e/.env.test.example`**

```
# Copie para e2e/.env.test — este arquivo (.example) vai pro git, o outro NÃO.
# TEST_DATABASE_URL precisa terminar em /cryoflix_test — o setup do banco
# de teste recusa rodar (de propósito) se apontar para qualquer outro banco.
# Porta 5433 (não 5432): ver Global Constraints no topo do plano.
TEST_DATABASE_URL=
BACKEND_TEST_PORT=4010
FRONTEND_TEST_PORT=5183
```

- [ ] **Step 4: Criar o `.env.test` local (não commitado) a partir do example**

Run: `cd e2e && cp .env.test.example .env.test`
Expected: arquivo `e2e/.env.test` criado com o mesmo conteúdo do example.

- [ ] **Step 5: Atualizar `.gitignore` da raiz**

Adicionar ao final do arquivo `.gitignore` (raiz do repo):

```
# Playwright (e2e/)
/e2e/.env.test
/e2e/test-results/
/e2e/playwright-report/
```

- [ ] **Step 6: Instalar dependências e o browser do Playwright**

Run: `cd e2e && npm install`
Expected: `node_modules/` criado em `e2e/`, sem erros.

Run: `cd e2e && npx playwright install chromium`
Expected: download do binário do Chromium concluído sem erro.

- [ ] **Step 7: Verificar que o CLI do Playwright funciona**

Run: `cd e2e && npx playwright --version`
Expected: imprime algo como `Version 1.5x.x` (confirma a instalação, ainda
não há testes nem config — isso vem nas próximas tasks).

- [ ] **Step 8: Commit**

```bash
git add e2e/package.json e2e/package-lock.json e2e/tsconfig.json e2e/.env.test.example .gitignore
git commit -m "chore(e2e): scaffold Playwright project"
```

---

### Task 2: Proxy configurável no Vite (para apontar o frontend de teste ao backend de teste)

**Files:**
- Modify: `frontend/vite.config.ts`

**Interfaces:**
- Consumes: nenhum.
- Produces: `frontend/vite.config.ts` lê `process.env.VITE_API_PROXY_TARGET`
  com fallback `'http://localhost:4000'` — usado pela Task 4 para apontar o
  frontend de teste ao backend de teste (porta 4010) sem mudar o
  comportamento padrão de `npm run dev`.

- [ ] **Step 1: Editar `frontend/vite.config.ts`**

Conteúdo atual (`frontend/vite.config.ts`):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

Novo conteúdo:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 2: Verificar que o default não mudou**

Run: `cd frontend && npm run dev -- --port 5199 --strictPort`
Expected: log do Vite mostra `Local: http://localhost:5199/`, sem erro de
configuração. Parar o processo (`Ctrl+C`) depois de confirmar.

- [ ] **Step 3: Verificar que a variável de ambiente sobrescreve o target**

Run: `cd frontend && VITE_API_PROXY_TARGET=http://localhost:9999 npm run dev -- --port 5199 --strictPort &`
Run (após o Vite subir, ~1-2s): `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/api/health`
Expected: a requisição falha ao tentar alcançar `localhost:9999` (nada rodando
lá) — código diferente de `200`, confirmando que o proxy de fato mudou de
alvo. Encerrar o processo em background depois (`kill %1`).

- [ ] **Step 4: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "feat(frontend): make vite api proxy target configurable via env"
```

---

### Task 3: Setup do banco de teste com guarda de segurança (TDD)

**Files:**
- Create: `e2e/scripts/setup-test-db.ts`
- Create: `e2e/global-setup.ts`
- Test: `e2e/tests/setup-test-db.spec.ts`

**Interfaces:**
- Produces:
  - `assertTestDatabaseUrl(url: string | undefined): string` — lança erro se
    `url` não estiver definida ou o nome do banco não for `cryoflix_test`;
    devolve a própria `url` se válida.
  - `setupTestDatabase(rawUrl: string | undefined): Promise<void>` — chama
    `assertTestDatabaseUrl`, depois `prisma generate`, `prisma migrate deploy`
    e `TRUNCATE` em todas as tabelas do banco de teste.
  - `export default globalSetup` em `e2e/global-setup.ts`, consumido por
    `e2e/playwright.config.ts` (Task 4) via `globalSetup:
    require.resolve('./global-setup')`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `e2e/tests/setup-test-db.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { assertTestDatabaseUrl } from '../scripts/setup-test-db';

test.describe('assertTestDatabaseUrl', () => {
  test('rejeita quando a URL não está definida', () => {
    expect(() => assertTestDatabaseUrl(undefined)).toThrow();
  });

  test('rejeita quando a URL aponta para o banco de dev', () => {
    expect(() =>
      assertTestDatabaseUrl('postgresql://localhost:5433/cryoflix'),
    ).toThrow('cryoflix_test');
  });

  test('aceita e devolve a URL quando aponta para cryoflix_test', () => {
    const url = 'postgresql://localhost:5433/cryoflix_test';
    expect(assertTestDatabaseUrl(url)).toBe(url);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd e2e && npx playwright test tests/setup-test-db.spec.ts`
Expected: FALHA — `Cannot find module '../scripts/setup-test-db'`.

- [ ] **Step 3: Implementar `e2e/scripts/setup-test-db.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/setup-test-db.spec.ts`
Expected: PASS — 3 testes, 0 falhas.

- [ ] **Step 5: Criar `e2e/global-setup.ts`**

```ts
import dotenv from 'dotenv';
import path from 'path';
import { setupTestDatabase } from './scripts/setup-test-db';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default async function globalSetup(): Promise<void> {
  await setupTestDatabase(process.env.TEST_DATABASE_URL);
}
```

- [ ] **Step 6: Rodar o typecheck**

Run: `cd e2e && npm run typecheck`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add e2e/scripts/setup-test-db.ts e2e/global-setup.ts e2e/tests/setup-test-db.spec.ts
git commit -m "feat(e2e): add test database setup with dev-database guard"
```

---

### Task 4: `playwright.config.ts` + smoke test (sobe backend e frontend de teste)

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/health.spec.ts`

**Interfaces:**
- Consumes: `setupTestDatabase` (Task 3, via `globalSetup.ts`),
  `VITE_API_PROXY_TARGET` (Task 2).
- Produces: `use.baseURL` = `http://localhost:${FRONTEND_TEST_PORT}` —
  usado por todos os specs de UI das Tasks 6-8 via `page.goto('/')`.

**Pré-requisito:** `docker compose up -d postgres` rodando na raiz do repo
(Postgres precisa estar acessível em `localhost:5433` — não 5432, ver Global
Constraints).

- [ ] **Step 1: Criar `e2e/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const backendPort = process.env.BACKEND_TEST_PORT ?? '4010';
const frontendPort = process.env.FRONTEND_TEST_PORT ?? '5183';
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${frontendPort}`,
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
      },
    },
  ],
});
```

- [ ] **Step 2: Criar `e2e/tests/health.spec.ts`**

```ts
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
```

- [ ] **Step 3: Rodar a suíte inteira pela primeira vez**

Run: `cd e2e && npx playwright test`
Expected: PASS em todos os testes (`setup-test-db.spec.ts` + `health.spec.ts`).
O `globalSetup` deve logar a criação/migração do banco `cryoflix_test` (via
`prisma migrate deploy`) antes de qualquer teste rodar. Se o Postgres não
estiver de pé, a falha deve ser clara (erro de conexão), não um timeout
silencioso.

- [ ] **Step 4: Commit**

```bash
git add e2e/playwright.config.ts e2e/tests/health.spec.ts
git commit -m "feat(e2e): wire playwright webServer for backend+frontend test instances"
```

---

### Task 5: Helpers de banco de teste (TDD)

**Files:**
- Create: `e2e/helpers/db.ts`
- Create: `e2e/helpers/testUser.ts`
- Test: `e2e/tests/db-helper.spec.ts`

**Interfaces:**
- Produces:
  - `prismaTest: PrismaClient` — cliente Prisma apontado para `cryoflix_test`.
  - `getEmailVerifyToken(email: string): Promise<string>` — usado pelas
    Tasks 6-8 para simular o clique no link de verificação de e-mail.
  - `makeTestUser(): { name: string; email: string; password: string }` —
    usado por todas as tasks de teste de UI/API para gerar um usuário único.

- [ ] **Step 1: Escrever o teste que falha**

Criar `e2e/tests/db-helper.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { prismaTest, getEmailVerifyToken } from '../helpers/db';

test('getEmailVerifyToken lê o token gravado no banco de teste', async () => {
  const email = `helper-test+${randomUUID()}@e2e.cryoflix.local`;
  const token = randomUUID();

  await prismaTest.user.create({
    data: {
      email,
      username: `helper_${randomUUID().slice(0, 8)}`,
      passwordHash: 'hash-nao-usado-neste-teste',
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + 60_000),
    },
  });

  await expect(getEmailVerifyToken(email)).resolves.toBe(token);

  await prismaTest.user.delete({ where: { email } });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd e2e && npx playwright test tests/db-helper.spec.ts`
Expected: FALHA — `Cannot find module '../helpers/db'`.

- [ ] **Step 3: Implementar `e2e/helpers/db.ts`**

```ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');

export const prismaTest = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

export async function getEmailVerifyToken(email: string): Promise<string> {
  const user = await prismaTest.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.emailVerifyToken) {
    throw new Error(`Nenhum emailVerifyToken pendente para ${email}`);
  }
  return user.emailVerifyToken as string;
}
```

- [ ] **Step 4: Implementar `e2e/helpers/testUser.ts`**

```ts
import { randomUUID } from 'crypto';

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export function makeTestUser(): TestUser {
  return {
    name: 'Playwright Tester',
    email: `playwright+${randomUUID()}@e2e.cryoflix.local`,
    password: 'Test1234!',
  };
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/db-helper.spec.ts`
Expected: PASS — 1 teste, 0 falhas.

- [ ] **Step 6: Rodar o typecheck**

Run: `cd e2e && npm run typecheck`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add e2e/helpers/db.ts e2e/helpers/testUser.ts e2e/tests/db-helper.spec.ts
git commit -m "feat(e2e): add test database helpers (verify token lookup, test user factory)"
```

---

### Task 6: Fluxo completo — cadastro → verificação → login (cenário 1)

**Files:**
- Create: `e2e/helpers/ui.ts`
- Create: `e2e/tests/auth-register-login.spec.ts`

**Interfaces:**
- Consumes: `makeTestUser` (Task 5), `getEmailVerifyToken` (Task 5).
- Produces: `switchToRegisterMode(page)`, `switchToLoginMode(page)`,
  `submitRegisterForm(page, user)`, `submitLoginForm(page, {email,password})`,
  `expectFormError(page, text)` — reusados pelas Tasks 7 e 8.

**Nota de comportamento real (não é bug a corrigir aqui):** o botão
"Registrar" do `LoginForm` cadastra E imediatamente tenta logar
(`AuthProvider.register` chama `login` internamente). Como a conta nasce
`PENDING_VERIFICATION`, essa tentativa de login falha com
`EMAIL_NOT_VERIFIED` — ou seja, **o formulário de cadastro sempre mostra esse
erro no clique**, mesmo em cadastro bem-sucedido. O teste abaixo reflete esse
comportamento real em vez de tentar contorná-lo.

- [ ] **Step 1: Criar `e2e/helpers/ui.ts`**

```ts
import { Page, expect } from '@playwright/test';
import type { TestUser } from './testUser';

// AppLayout também renderiza um botão "Entrar" no header (navega para
// /account) sempre que !user — o mesmo texto do toggle do LoginForm. Por
// isso os toggles são localizados dentro de `.login-form_toggle`, nunca
// pelo texto sozinho, para não colidir com o botão do header.
const loginFormToggle = (page: Page) => page.locator('.login-form_toggle');

export async function switchToRegisterMode(page: Page): Promise<void> {
  await loginFormToggle(page).getByRole('button', { name: 'Criar conta' }).click();
}

export async function switchToLoginMode(page: Page): Promise<void> {
  await loginFormToggle(page).getByRole('button', { name: 'Entrar', exact: true }).click();
}

export async function submitRegisterForm(page: Page, user: TestUser): Promise<void> {
  await switchToRegisterMode(page);
  await page.getByLabel('Nome').fill(user.name);
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);
  await page.locator('button[type="submit"]').click();
}

export async function submitLoginForm(
  page: Page,
  user: Pick<TestUser, 'email' | 'password'>,
): Promise<void> {
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);
  await page.locator('button[type="submit"]').click();
}

export async function expectFormError(page: Page, text: string): Promise<void> {
  await expect(page.locator('.status.error')).toHaveText(text);
}
```

- [ ] **Step 2: Criar `e2e/tests/auth-register-login.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectFormError,
} from '../helpers/ui';

test('cadastro, verificação de e-mail e login mostram o usuário autenticado', async ({
  page,
  request,
}) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  // AuthProvider.register tenta logar automaticamente após o cadastro;
  // a conta ainda não está verificada, então isso falha — comportamento
  // real do app, não um efeito colateral do teste.
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  await switchToLoginMode(page);
  await submitLoginForm(page, user);

  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();
});
```

- [ ] **Step 3: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/auth-register-login.spec.ts`
Expected: PASS — 1 teste, 0 falhas.

- [ ] **Step 4: Rodar o typecheck**

Run: `cd e2e && npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/ui.ts e2e/tests/auth-register-login.spec.ts
git commit -m "test(e2e): cover register -> verify email -> login happy path"
```

---

### Task 7: Casos inválidos — e-mail não verificado e senha errada (cenários 2 e 3)

**Files:**
- Create: `e2e/tests/auth-invalid-cases.spec.ts`

**Interfaces:**
- Consumes: `makeTestUser`, `getEmailVerifyToken` (Task 5);
  `submitRegisterForm`, `switchToLoginMode`, `submitLoginForm`,
  `expectFormError` (Task 6).

**Nota de ordem de checagem real:** `LoginUserUseCase` checa
`status === 'PENDING_VERIFICATION'` **antes** de comparar a senha — então
uma conta não verificada sempre mostra "Verifique seu e-mail...", mesmo com
senha errada. Por isso o teste de senha errada precisa de uma conta já
verificada.

- [ ] **Step 1: Criar `e2e/tests/auth-invalid-cases.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import {
  submitRegisterForm,
  switchToLoginMode,
  submitLoginForm,
  expectFormError,
} from '../helpers/ui';

test('login antes de verificar o e-mail mostra o erro correto', async ({ page }) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');

  // Tentativa explícita de login (caminho de código diferente do
  // auto-login disparado pelo cadastro) — a conta continua não verificada.
  await switchToLoginMode(page);
  await submitLoginForm(page, user);
  await expectFormError(page, 'Verifique seu e-mail antes de fazer login.');
});

test('login com senha errada em conta verificada mostra credenciais inválidas', async ({
  page,
  request,
}) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  const verifyToken = await getEmailVerifyToken(user.email);
  await request.get(`/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`);

  await switchToLoginMode(page);
  await submitLoginForm(page, { email: user.email, password: 'SenhaErrada1!' });

  await expectFormError(page, 'Credenciais inválidas');
});
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/auth-invalid-cases.spec.ts`
Expected: PASS — 2 testes, 0 falhas.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/auth-invalid-cases.spec.ts
git commit -m "test(e2e): cover unverified-email and wrong-password login errors"
```

---

### Task 8: Logout (cenário 4)

**Files:**
- Create: `e2e/tests/auth-logout.spec.ts`

**Interfaces:**
- Consumes: `makeTestUser`, `getEmailVerifyToken` (Task 5);
  `submitRegisterForm`, `switchToLoginMode`, `submitLoginForm` (Task 6).

- [ ] **Step 1: Criar `e2e/tests/auth-logout.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';
import { submitRegisterForm, switchToLoginMode, submitLoginForm } from '../helpers/ui';

test('logout limpa a sessão e volta ao formulário de login', async ({ page, request }) => {
  const user = makeTestUser();
  await page.goto('/');

  await submitRegisterForm(page, user);
  const verifyToken = await getEmailVerifyToken(user.email);
  await request.get(`/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`);

  await switchToLoginMode(page);
  await submitLoginForm(page, user);
  await expect(page.getByText(`Bem-vindo, ${user.name}`)).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();

  await expect(page.getByRole('heading', { name: 'Entrar ou criar conta' })).toBeVisible();
  const storedToken = await page.evaluate(() => localStorage.getItem('fflix_access_token'));
  expect(storedToken).toBeNull();
});
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/auth-logout.spec.ts`
Expected: PASS — 1 teste, 0 falhas.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/auth-logout.spec.ts
git commit -m "test(e2e): cover logout clearing session and tokens"
```

---

### Task 9: Rotação de refresh token via API direta (cenário 5)

> **DEFERRED — não implementado nesta branch.** A implementação inicial
> (commit `2aaaa6f`) empacotou junto com o teste duas mudanças de produção
> não autorizadas no backend (`create`→`upsert` em
> `PrismaRefreshTokenRepository.save`, mapeamento genérico de erro JWT em
> `app.ts`) além de uma terceira que era o fix real (claim `jti` ausente em
> `JWTService.generateTokens`, causando colisão de token quando gerado no
> mesmo segundo). A revisão da task classificou como "Needs fixes" e
> recomendou manter só o `jti`+teste, reverter o `upsert` e propor o fix de
> erro JWT separadamente com sua própria cobertura de teste. O usuário optou
> por pular a task inteira em vez de corrigi-la agora — revertida por
> completo em `347a357`. `e2e/tests/auth-refresh.spec.ts` não existe nesta
> branch; nenhum dos três arquivos de backend abaixo foi alterado.

**Files:**
- Create: `e2e/tests/auth-refresh.spec.ts`

**Interfaces:**
- Consumes: `makeTestUser`, `getEmailVerifyToken` (Task 5).

- [ ] **Step 1: Criar `e2e/tests/auth-refresh.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { makeTestUser } from '../helpers/testUser';
import { getEmailVerifyToken } from '../helpers/db';

test('POST /api/auth/refresh rotaciona o token e invalida o anterior', async ({ request }) => {
  const user = makeTestUser();

  const registerResponse = await request.post('/api/auth/register', { data: user });
  expect(registerResponse.ok()).toBeTruthy();

  const verifyToken = await getEmailVerifyToken(user.email);
  const verifyResponse = await request.get(
    `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  expect(verifyResponse.ok()).toBeTruthy();

  const loginResponse = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const { refreshToken: originalRefreshToken } = await loginResponse.json();

  const refreshResponse = await request.post('/api/auth/refresh', {
    data: { refreshToken: originalRefreshToken },
  });
  expect(refreshResponse.ok()).toBeTruthy();
  const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
  expect(accessToken).toBeTruthy();
  expect(newRefreshToken).toBeTruthy();
  expect(newRefreshToken).not.toBe(originalRefreshToken);

  // Reuso do refresh token já revogado deve ser rejeitado.
  const reuseResponse = await request.post('/api/auth/refresh', {
    data: { refreshToken: originalRefreshToken },
  });
  expect(reuseResponse.status()).toBe(401);
});
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `cd e2e && npx playwright test tests/auth-refresh.spec.ts`
Expected: PASS — 1 teste, 0 falhas.

- [ ] **Step 3: Rodar a suíte inteira uma última vez**

Run: `cd e2e && npx playwright test`
Expected: PASS em todos os arquivos (`setup-test-db`, `db-helper`, `health`,
`auth-register-login`, `auth-invalid-cases`, `auth-logout`, `auth-refresh`).

- [ ] **Step 4: Rodar o typecheck do projeto e2e uma última vez**

Run: `cd e2e && npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add e2e/tests/auth-refresh.spec.ts
git commit -m "test(e2e): cover refresh token rotation and reuse rejection"
```
