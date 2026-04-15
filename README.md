# CryoFlix – Plataforma de Streaming

Monorepo contendo:

- `backend/`: API Node.js + Express + TypeScript organizada por domínio (DDD) e exposta via API Gateway REST.
- `frontend/`: Single Page Application em React + Vite + TypeScript para visualizar roadmap, microserviços e contratos REST.

## Requisitos Atendidos

- Microsserviços principais (Auth, User, Content, Upload, Transcoding, Streaming, Payment, Recommendation, Analytics, Notification).
- API REST documentada via `frontend` (seção API Explorer) e consolidada em `backend/src/routes`.
- Arquitetura orientada a DDD com camadas `domain/application/infrastructure/presentation`.
- Suporte a padrões: JWT, CQRS light (analytics), filas fictícias para upload/transcoding, mock database em memória.

## Back-end

```bash
cd backend
npm install
npm run dev              # TS + nodemon
npm run build            # compila para dist/
npm start                # executa código compilado
npm run test:integrations # testa integrações com APIs externas
npm run lint             # verifica código com ESLint
```

### Endpoints Principais

- `POST /api/auth/register | login | refresh`
- `GET /api/users/me`, `PATCH /api/users/me/preferences`, `GET /api/users/:id/history`
- `POST /api/content`, `GET /api/content`, `POST /api/content/:id/publish`
- `POST /api/upload/signed-url`, `POST /api/upload/callback`
- `POST /api/transcoding/jobs`, `GET /api/transcoding/jobs/:id`
- `GET /api/streaming/playback/:videoId`, `POST /api/streaming/sessions/:sessionId/heartbeat`
- `POST /api/payments/subscriptions`, `GET /api/payments/subscriptions/:id`, `POST /api/payments/webhooks`
- `GET /api/recommendations/:userId`, `POST /api/recommendations/feedback`
- `GET /api/analytics/metrics`, `POST /api/analytics/events`
- `POST /api/notifications/email | push`
- `GET /api/metadata/movies`, `GET /api/metadata/:id`, `/trending`, `/recommendations`
- `GET /api/player/:movieId/embed`, `POST /api/player/progress`, `GET /api/player/:movieId/progress`
- `GET /api/subtitles`, `GET /api/subtitles/:fileId/download`

## Front-end

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # artefatos prontos para deploy
```

Features principais:

- Aplicação de streaming completa (Home, Catálogo, Watch e Conta) com React Router e React Query.
- Autenticação (login/registro) usando Auth Service real, tokens persistidos e proteção de rotas sensíveis.
- **Integração com TMDb**: Home e Catálogo exibem filmes reais do The Movie Database com busca em tempo real.
- **Player com SuperEmbed**: Reprodução via embed URLs com validação de segurança e persistência de progresso.
- **Legendas PT-BR**: Integração com OpenSubtitles para buscar e baixar legendas em português.
- Página de conta exibindo perfil + atualização de preferências que conversa com o User Service.
- Continue Watching alimentado pelo histórico do usuário e recomendações simples no painel lateral.

## Variáveis de Ambiente

Copie `backend/.env.example` (defina PORT, JWT, CDN etc). Para o front, use `VITE_API_URL` caso seu gateway não seja `http://localhost:4000/api`.

Integrações externas disponíveis exigem as chaves abaixo:

```env
TMDB_API_KEY= # https://www.themoviedb.org/settings/api
TMDB_BASE_URL=https://api.themoviedb.org/3
SUPEREMBED_BASE_URL=https://multiembed.mov
OPENSUBTITLES_API_KEY=
OPENSUBTITLES_USERNAME=
OPENSUBTITLES_USER_AGENT=CryoFlix/1.0

# Redis (opcional - usa cache em memória se não configurado)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=true
```

## Arquitetura e Infraestrutura

- **Cache**: Suporte a Redis com fallback automático para cache em memória. Configure `REDIS_ENABLED=true` para usar Redis.
- **Persistência**: Progresso de watch é persistido no banco em memória (pronto para migração para PostgreSQL).
- **Clean Architecture**: Todos os módulos seguem DDD com separação clara de camadas (domain/application/infrastructure/presentation).
- **ESLint**: Configurado com regras TypeScript para manter qualidade de código.

## Testes de Integração

Execute o script automatizado para testar todas as integrações:

```bash
npm run test:integrations
```

O script verifica:
- ✅ TMDb API (busca e trending)
- ✅ SuperEmbed (geração de URLs)
- ✅ OpenSubtitles (busca de legendas)
- ✅ Redis (cache set/get)

**Nota:** Configure as chaves de API no arquivo `.env` antes de executar os testes. Veja `backend/CONFIGURATION.md` para instruções detalhadas.

## Próximos Passos

- Migrar persistência de progresso e histórico para PostgreSQL com Prisma/TypeORM.
- Adicionar testes unitários e de integração (Jest) para os novos serviços.
- Implementar observabilidade (OpenTelemetry + Grafana stack) para monitorar performance das APIs externas.
- Integrar CDN/DRM reais e pipeline de upload/transcoding via filas (Bull/RabbitMQ).