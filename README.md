# CryoFlix

Aplicação de catálogo e reprodução de vídeos com frontend React, API Node.js/Express em TypeScript e painel administrativo. O backend reúne módulos por domínio e usa Prisma com PostgreSQL para contas, sessões e progresso de reprodução.

## Tecnologias utilizadas

- **Linguagens e runtime**: TypeScript, JavaScript, Node.js.
- **Frontend**: React, React Router DOM, TanStack React Query, Tailwind CSS, Vite (Rolldown), ESLint.
- **Backend**: Express, Prisma (PostgreSQL), CORS, Helmet, Express Rate Limit, JSON Web Token, BcryptJS, Multer, Zod, Axios, Pino.
- **Cache e infraestrutura**: Redis (ioredis) com fallback para cache em memória; deploy na Vercel.
- **Integrações externas**: The Movie Database (TMDb), SuperEmbed, SuperFlix, OpenSubtitles.
- **Qualidade e testes**: Jest, Supertest, ts-jest, Playwright, TypeScript ESLint.

## Requisitos

- Node.js 22 e npm.
- PostgreSQL 16 ou superior para persistir dados após reiniciar e usar o painel.
- Uma chave própria do TMDb para consultar o catálogo.
- Redis opcional na execução local. O Docker Compose inclui PostgreSQL e Redis.
- SMTP opcional. Sem SMTP configurado, novas contas já são criadas verificadas (não há como entregar o e-mail de verificação).

Os players externos dependem dos respectivos fornecedores. O player local permite verificar o salvamento e a retomada sem depender desses serviços.

## Configuração local

Copie os exemplos somente na primeira configuração. Se os arquivos .env já existem, atualize os campos necessários sem sobrescrever suas configurações.

~~~powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item admin/.env.example admin/.env
~~~

Em **backend/.env**, preencha:

- **DATABASE_URL**: URL de um banco existente, com usuário e senha válidos. Use a porta do seu servidor. O Compose publica PostgreSQL em localhost:5433; uma instalação nativa normalmente usa 5432.
- **JWT_SECRET** e **REFRESH_SECRET**: segredos próprios e diferentes. Produção exige ao menos 32 caracteres e recusa exemplos previsíveis.
- **TMDB_API_KEY**: sua chave do TMDb.
- **FRONTEND_URL=http://localhost:5173** e **ADMIN_URL=http://localhost:5174** na execução local.
- **REDIS_ENABLED=false** se não houver Redis local.

Para gerar um segredo, execute uma vez para cada variável e copie o resultado para o .env:

~~~powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

Sem segredos configurados em desenvolvimento/teste, a API gera chaves efêmeras e reiniciar exige novo login. Configure segredos próprios e estáveis para conservar sessões entre reinícios. Produção exige DATABASE_URL e os dois segredos explícitos.

Não envie arquivos .env ao Git. Cada ambiente deve usar suas próprias credenciais.

### Backend e banco

Crie o banco configurado em DATABASE_URL com seu cliente PostgreSQL. Depois:

~~~powershell
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
~~~

A API atende em http://localhost:4000. O endpoint /health verifica que o processo HTTP está ativo. A documentação REST fica em http://localhost:4000/api/docs.

DATABASE_URL vazia em desenvolvimento seleciona dados em memória. Esse modo perde dados ao reiniciar e não disponibiliza as operações administrativas que exigem banco.

### Frontend

Em outro terminal:

~~~powershell
cd frontend
npm ci
npm run dev -- --port 5173 --strictPort
~~~

Abra http://localhost:5173. O Vite encaminha /api para o backend na porta 4000. Use VITE_API_URL apenas para uma API remota, incluindo o prefixo /api. VITE_ADMIN_URL aponta para o painel.

### Painel administrativo

Em outro terminal:

~~~powershell
cd admin
npm ci
npm run dev
~~~

Abra http://localhost:5174. O painel encaminha /api para o backend na porta 4000. Se configurar VITE_API_URL no painel, informe apenas a origem, sem /api: o cliente acrescenta esse prefixo.

### Criação do administrador

Não existe conta administrativa com senha padrão. Defina ADMIN_EMAIL e ADMIN_PASSWORD em backend/.env. A senha deve conter ao menos 12 caracteres, maiúscula, minúscula, número e símbolo.

~~~powershell
cd backend
npx prisma db seed
~~~

O seed cria ou atualiza a conta desse e-mail, inclusive senha e papel. Use uma conta destinada à administração. Cadastros públicos criam usuários comuns. O servidor verifica o papel atual do usuário em cada requisição administrativa.

Para usuários comuns, crie a conta e entre. Com SMTP configurado, é preciso confirmar o e-mail antes do primeiro login; sem SMTP, a conta já nasce verificada.

## Execução com Docker Compose

~~~powershell
Copy-Item env.example .env
~~~

Preencha na raiz POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET e REFRESH_SECRET com valores próprios e distintos. Use segredos hexadecimais gerados pelo comando anterior, especialmente para a senha PostgreSQL usada na URL. Preencha TMDB_API_KEY e, quando necessário, as variáveis de SMTP.

~~~powershell
docker compose up --build -d
~~~

Endereços:

- Frontend: http://localhost:3000.
- Painel: http://localhost:3001.
- Backend: http://localhost:4000.
- PostgreSQL: localhost:5433.

O backend aplica as migrações ao iniciar. Para criar o administrador, configure ADMIN_EMAIL e ADMIN_PASSWORD no .env da raiz antes de subir os contêineres e execute:

~~~powershell
docker compose exec backend node dist/seed.js
~~~

Se configurar essas variáveis depois de iniciar o Compose, recrie o backend antes do seed para carregar os novos valores:

~~~powershell
docker compose up -d --no-deps --force-recreate backend
docker compose exec backend node dist/seed.js
~~~

O Compose exige os segredos antes de iniciar, e o Redis usa autenticação. Os volumes conservam os dados. Alterar POSTGRES_PASSWORD no .env não redefine a senha de um PostgreSQL já inicializado em um volume: a configuração deve corresponder às credenciais desse banco.

## Histórico e retomada da reprodução

Cada ponto pertence ao usuário autenticado e ao filme. O banco armazena posição em segundos, progresso e data do evento. O histórico inclui títulos parciais e concluídos. A leitura pelo Prisma utiliza os registros de watch_progress, com compatibilidade para histórico antigo.

Para demonstrar a retomada automática:

1. Entre e abra um título.
2. Em **Continuar assistindo**, selecione um vídeo em **Abrir vídeo do dispositivo**.
3. Reproduza e pause. Aguarde a confirmação do ponto salvo.
4. Saia da conta, reinicie a API e entre novamente.
5. Abra o mesmo título e selecione o mesmo arquivo. O player recupera o ponto salvo.

O arquivo permanece no dispositivo, sem upload. O navegador exige selecionar o arquivo novamente ao retornar. O player salva ao pausar, avançar e em intervalos de reprodução. A ordenação dos eventos impede que uma requisição antiga sobrescreva um ponto mais recente.

Os players externos abrem em outro domínio e não oferecem uma integração de posição documentada. Para eles, a aplicação apresenta um marcador manual em minutos e segundos. Ao voltar, use o marcador para ajustar o player externo. Essa opção não oferece retomada automática.

## Falhas da API de filmes

| Situação | Resposta da API | Interface |
|---|---|---|
| Consulta válida sem filmes | 200 com lista vazia | Ausência de resultados |
| Identificador inexistente | 404 | Filme não encontrado e opção de voltar |
| Indisponibilidade, timeout ou chave ausente/inválida | 503 | Mensagem de indisponibilidade e nova tentativa |
| Resposta malformada ou ID divergente | 502 | Falha da integração |

As falhas não viram filmes inventados ou listas vazias. O catálogo pode manter resultados anteriores enquanto informa que uma atualização falhou. A API não repassa detalhes privados da resposta do fornecedor.

## Testes e verificações

### Backend

~~~powershell
cd backend
npm test
npm run build
npm run lint
~~~

Os testes Jest usam repositórios em memória, desabilitam Redis e ignoram DATABASE_URL do .env local. As falhas do TMDb usam respostas controladas. A suíte cobre permissões por requisições diretas, configuração de produção, histórico/progresso e falhas externas.

### Frontend e painel

~~~powershell
cd frontend
npm run build
npx tsc --noEmit
npm run lint
~~~

~~~powershell
cd admin
npm run build
npm run lint
~~~

### Navegador e persistência real

~~~powershell
cd e2e
npm ci
Copy-Item .env.test.example .env.test
npx playwright install chromium
~~~

Preencha TEST_DATABASE_URL com credenciais válidas e o nome exato **cryoflix_test**. A suíte cria esse banco quando possível, aplica migrações e limpa suas tabelas. Nunca use o banco da aplicação. A validação recusa outros nomes.

~~~powershell
npm run typecheck
npm run test:e2e
~~~

No Windows, pode usar o Edge instalado definindo $env:PLAYWRIGHT_CHANNEL='msedge' antes do comando. Os testes sobem frontend/backend em portas separadas, com segredos aleatórios exclusivos da execução.

A suíte reinicia um processo real da API com o mesmo PostgreSQL, faz novo login e verifica o ponto e o histórico. O teste do player reproduz um vídeo local e verifica o tempo recuperado. Os testes de erros da interface simulam as respostas externas necessárias.

O vídeo e2e/fixtures/flower.mp4 vem dos [exemplos CC0 da MDN](https://github.com/mdn/interactive-examples/tree/main/live-examples/media/cc0-videos). Sua origem está registrada em e2e/fixtures/ATTRIBUTION.txt.

### Registro desta entrega

Verificação realizada em **21/11/2026**, no Windows, com Node.js 22.14.0, npm 11.12.1, Edge e PostgreSQL 17 em banco de teste separado. Nenhum dado do banco original ou arquivo .env do usuário foi alterado.

| Verificação | Resultado |
|---|---|
| Jest, testes unitários e HTTP | 78 testes aprovados em 7 suítes |
| Playwright com PostgreSQL real e cenários de interface | 22 cenários distintos aprovados |
| Compilação de backend, frontend e painel | Aprovada nos três projetos |
| TypeScript do frontend e dos testes E2E | Aprovado |
| Lint de backend, frontend e painel | Sem erros |
| Estrutura YAML do Compose | Validada |

O total é de **100 testes distintos aprovados**. No Playwright, a suíte completa inicial passou em 21 cenários. Após acrescentar a verificação de evento antigo no PostgreSQL, a suíte de histórico passou novamente nos três cenários, dois deles já incluídos na execução anterior.

As comprovações incluem usuário comum bloqueado por requisição direta à API administrativa, configuração insegura recusada em produção, retomada após novo login e reinício de um processo real da API, isolamento do progresso entre usuários, ordenação de gravações e recuperação após falhas externas simuladas.

O lint do backend conserva 47 avisos em scripts e módulos legados. O build do painel conserva um aviso de pacote maior que 500 kB. Esses avisos não interrompem compilação ou execução dos testes. A CLI Docker não está instalada neste ambiente: os contêineres não foram executados, e a validação do Compose foi estrutural. A execução com os fornecedores externos reais exige chaves próprias e disponibilidade dos serviços.

## Integrações opcionais e limites

Em backend/.env, OPENSUBTITLES_API_KEY configura legendas. SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS configuram envio de e-mails. REDIS_ENABLED=true e REDIS_HOST, REDIS_PORT e REDIS_PASSWORD configuram cache externo.

O comando abaixo depende de chaves e serviços reais disponíveis e complementa os testes determinísticos:

~~~powershell
cd backend
npm run test:integrations
~~~

Testes com respostas controladas não comprovam a disponibilidade futura dos fornecedores nem o funcionamento de todos os filmes nos players externos.
