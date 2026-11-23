process.env.REDIS_ENABLED = 'false';
// A suíte HTTP é isolada dos dados e das credenciais presentes no .env local.
process.env.DATABASE_URL = '';
process.env.NODE_ENV = 'test';

