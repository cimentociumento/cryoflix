# Fase 2 — E2E de autenticação com Playwright

Data: 2026-08-11

## Contexto

`INVENTARIO.md` (Fase 1 de reconhecimento) terminou apontando "Fase 2
(Playwright)" como próximo passo, sem detalhar escopo. O usuário aprovou
iniciar, com uma condição explícita: **conferir o banco de teste antes de
deixar os testes rodarem** — motivada pelo fato de que hoje, sem
`backend/.env`, o backend roda em modo InMemory, e não existe nenhum banco
de teste isolado configurado no repositório.

O código real diverge da arquitetura descrita em `CLAUDE.md` (Clean
Architecture por módulo + Prisma, não `routes/services/repositories` +
Drizzle) — isso já está documentado em `INVENTARIO.md` e não é escopo desta
fase mudar; o design abaixo trabalha com o código como ele existe hoje.

## Escopo

Cenários cobertos, via navegador real (Playwright dirigindo o `LoginForm`
existente em `frontend/src/features/auth/components/LoginForm/`):

1. Cadastro → verificação de e-mail (via backdoor de banco, ver abaixo) →
   login com sucesso → UI mostra usuário autenticado.
2. Tentativa de login antes de verificar o e-mail → UI mostra o erro
   `EMAIL_NOT_VERIFIED` retornado por `LoginUserUseCase`.
3. Login com senha errada → UI mostra "Credenciais inválidas".
4. Logout (botão "Sair" em `AppLayout.tsx`) → UI volta ao estado deslogado.

Via chamada HTTP direta (Playwright `request` context, sem navegador — não
há gatilho de UI para isso hoje, confirmado em `INVENTARIO.md`):

5. `POST /api/auth/refresh` rotaciona o refresh token corretamente.

Fora de escopo desta fase: rotas `/api/admin/*`, `/api/content`, e as
inconsistências de autorização listadas em `INVENTARIO.md` (ex:
`/users/:id/history`). Ficam para uma fase futura.

## Banco de teste

- Mesmo container Postgres do `docker-compose.yml` (`cryoflix-pg`), banco
  **separado**: `cryoflix_test` — não o `cryoflix` de dev. Sem container
  novo, sem porta nova.
- `e2e/scripts/setup-test-db.ts`, executado no `globalSetup` do Playwright:
  1. Conecta como `cryoflix` no banco de manutenção `postgres` e roda
     `CREATE DATABASE cryoflix_test` se não existir (idempotente).
  2. Roda `prisma migrate deploy` (schema de `backend/prisma/`) contra
     `cryoflix_test`.
  3. Trunca todas as tabelas de aplicação (`TRUNCATE ... CASCADE`) para
     começar cada rodada limpa.
- **Guarda de segurança** (o requisito do usuário): antes de qualquer ação,
  o script valida que a `DATABASE_URL` resolvida termina em
  `/cryoflix_test`. Se apontar para `cryoflix` (dev) ou qualquer outra
  coisa, lança erro e aborta sem tocar em nada. Isso é o freio contra rodar
  os testes em cima de dado real.
- `e2e/.env.test` (novo, local — git-ignored; `e2e/.env.test.example` vai pro
  git) define:
  - `TEST_DATABASE_URL=postgresql://cryoflix:cryoflix_dev@localhost:5432/cryoflix_test`
  - `BACKEND_TEST_PORT=4010` (isolada da porta de dev, 4000/3333 — nunca
    reaproveita um backend de dev já rodando)
  - `FRONTEND_TEST_PORT=5183`
- Redis: reusa o Redis de dev (`localhost:6379`). Não precisa isolar — é só
  cache/rate-limit, degrada aberto por decisão já documentada no
  `CLAUDE.md`; os testes não dependem do estado dele.

## Subida dos processos (Playwright `webServer`)

`e2e/playwright.config.ts` sobe os dois processos automaticamente antes da
suíte e derruba depois, sempre com `reuseExistingServer: false`:

- **Backend**: `npm run dev` em `backend/`, com `NODE_ENV`/`PORT`/`DATABASE_URL`
  passados diretamente no `env` da entrada `webServer` do Playwright (lidos de
  `e2e/.env.test`, não `backend/.env.test` — evita depender da precedência de
  `dotenv.config()` dentro de `environment.ts`; o valor que o Playwright
  injeta sempre vence).
- **Frontend**: `npm run dev` em `frontend/`, porta isolada `5183`, com
  `VITE_API_PROXY_TARGET=http://localhost:4010`. Requer ajuste pequeno em
  `frontend/vite.config.ts`: o proxy de `/api` passa a ler
  `process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000'` em vez do
  valor fixo — comportamento de dev normal não muda (mesmo default), só
  fica configurável.

## Backdoor de verificação de e-mail

`RegisterUserUseCase` só chama `EmailService.sendVerificationEmail` quando
`NODE_ENV !== 'test'` — e como rodamos os testes com `NODE_ENV=test`, o
e-mail nunca é sequer tentado (não há SMTP configurado de qualquer forma).

Solução: `e2e/helpers/db.ts` expõe um `PrismaClient` apontado para
`cryoflix_test`, usado **só dentro dos testes** para ler o
`emailVerifyToken` do usuário recém-cadastrado (por e-mail) logo após o
cadastro. O teste então chama `GET /api/auth/verify-email?token=...`
diretamente antes de tentar logar pela UI. É um atalho de teste, não um
endpoint novo em produção.

Cada teste usa um e-mail único (`playwright+<uuid>@e2e.cryoflix.local`) —
evita colisão entre testes paralelos sem precisar truncar entre cada um.

## Estrutura de arquivos

```
e2e/
  package.json          # projeto próprio (Playwright + Prisma client), não é workspace
  playwright.config.ts
  global-setup.ts
  scripts/setup-test-db.ts
  helpers/db.ts
  helpers/testUser.ts
  helpers/ui.ts
  .env.test              # novo, local (git-ignored)
  .env.test.example       # novo, commitado
  tests/
    setup-test-db.spec.ts
    db-helper.spec.ts
    health.spec.ts
    auth-register-login.spec.ts
    auth-invalid-cases.spec.ts   # e-mail não verificado, senha errada
    auth-refresh.spec.ts         # API direta
    auth-logout.spec.ts
```

`.gitignore` ganha entradas para `/e2e/.env.test`, `/e2e/test-results/` e
`/e2e/playwright-report/` — hoje só `.env` puro é ignorado, `.env.test`
passaria despercebido.

**Correção de um bug de design encontrado durante o plano:** `AppLayout`
também renderiza um botão "Entrar" no header (navega para `/account`)
sempre que `!user` — o mesmo texto do toggle do `LoginForm`. Um seletor por
texto simples (`getByRole('button', { name: 'Entrar' })`) bateria nos dois
elementos ao mesmo tempo na home. Os helpers de UI escopam a busca dentro de
`.login-form_toggle` para evitar essa ambiguidade.

## Erros e casos de borda

- Guarda de banco (acima) aborta o `globalSetup` inteiro se a
  `DATABASE_URL` não apontar para `cryoflix_test` — nenhum teste roda.
- Se o Postgres do `docker-compose.yml` não estiver de pé, `setup-test-db.ts`
  falha na conexão com mensagem clara (não silenciosamente cai para
  InMemory).
- Rate limit (`express-rate-limit`, store em memória) pode interferir se os
  testes rodarem em paralelo demais contra o mesmo backend — `playwright.config.ts`
  usa `workers: 1` para essa suíte, já que o volume de cenários é pequeno e
  não compensa a complexidade de isolar rate limit por worker.

## Testes

Este próprio design *é* a fase de testes — não há "testes dos testes".
Critério de pronto: os 5 cenários acima passam localmente com
`npm run test:e2e` (script novo em `e2e/package.json`), e falham
corretamente (mensagem clara, não timeout silencioso) se o Postgres de
`docker-compose.yml` não estiver rodando.
