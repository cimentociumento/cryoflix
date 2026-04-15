# Guia de Configuração - CryoFlix Backend

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `backend/` com as seguintes variáveis:

```env
# Server
NODE_ENV=development
PORT=4000

# JWT
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_SECRET=super-refresh-key-change-in-production
REFRESH_EXPIRES_IN=7d

# CDN
CDN_BASE_URL=https://cdn.cryoflix.local

# TMDb API
# Obtenha sua chave em: https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3

# SuperEmbed
SUPEREMBED_BASE_URL=https://multiembed.mov

# OpenSubtitles API
# Obtenha sua chave em: https://www.opensubtitles.com/en/consumers
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key_here
OPENSUBTITLES_USERNAME=cryoflix-demo
OPENSUBTITLES_USER_AGENT=CryoFlix/1.0

# Redis (opcional - cache em memória será usado se não configurado)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=false
```

## Como Obter as Chaves de API

### 1. TMDb API Key

1. Acesse https://www.themoviedb.org/
2. Crie uma conta ou faça login
3. Vá em Settings > API
4. Solicite uma API Key (tipo: Developer)
5. Copie a chave e cole em `TMDB_API_KEY`

### 2. OpenSubtitles API Key

1. Acesse https://www.opensubtitles.com/
2. Crie uma conta
3. Vá em https://www.opensubtitles.com/en/consumers
4. Crie uma aplicação para obter a API Key
5. Copie a chave e cole em `OPENSUBTITLES_API_KEY`

### 3. Redis (Opcional)

Para usar Redis como cache distribuído:

1. Instale Redis localmente ou use um serviço como Redis Cloud
2. Configure as variáveis:
   - `REDIS_HOST`: endereço do servidor Redis
   - `REDIS_PORT`: porta (padrão: 6379)
   - `REDIS_PASSWORD`: senha (se necessário)
   - `REDIS_ENABLED=true`: habilita Redis

**Instalação Local (Windows):**
- Use WSL2 ou Docker: `docker run -d -p 6379:6379 redis:alpine`

**Instalação Local (Linux/Mac):**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis
```

## Testando as Integrações

### Teste Manual via API

1. Inicie o servidor: `npm run dev`
2. Teste TMDb:
   ```bash
   curl http://localhost:4000/api/metadata/trending
   curl "http://localhost:4000/api/metadata/search?query=inception"
   ```

3. Teste Player:
   ```bash
   curl http://localhost:4000/api/player/550/embed
   ```

4. Teste Subtitles:
   ```bash
   curl "http://localhost:4000/api/subtitles?movieId=550"
   ```

### Verificar Status do Redis

Se Redis estiver habilitado, você verá no log:
```
Redis conectado
```

Se não estiver disponível:
```
Redis não disponível, usando cache em memória
```

## Dependências do Redis

O projeto usa `ioredis` como cliente Redis. Dependências necessárias:

- **ioredis**: Já incluído em `package.json`
- **@types/ioredis**: Tipos TypeScript (já incluído)

Para instalar:
```bash
npm install
```

## Troubleshooting

### Redis não conecta

1. Verifique se Redis está rodando: `redis-cli ping` (deve retornar `PONG`)
2. Verifique as variáveis de ambiente
3. Verifique firewall/portas
4. Se falhar, o sistema automaticamente usa cache em memória

### TMDb retorna erro 401

- Verifique se `TMDB_API_KEY` está correta
- Verifique se a chave não expirou
- Verifique rate limits da API

### OpenSubtitles retorna erro

- Verifique se `OPENSUBTITLES_API_KEY` está correta
- Verifique se `OPENSUBTITLES_USERNAME` está correto
- Verifique rate limits da API

