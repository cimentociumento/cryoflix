process.env.REDIS_ENABLED = 'false';
// Os testes da API usam repositórios em memória, mesmo quando há um .env local.
process.env.DATABASE_URL = '';

