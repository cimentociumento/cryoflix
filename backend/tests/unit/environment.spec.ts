jest.mock('dotenv', () => ({ __esModule: true, default: { config: jest.fn() } }));

type Environment = typeof import('../../src/config/environment')['env'];

function readEnvironment(): Environment {
  let result: Environment | undefined;
  jest.isolateModules(() => {
    // Cada leitura representa a inicialização de um novo processo.
    result = jest.requireActual<{ env: Environment }>('../../src/config/environment').env;
  });
  if (!result) throw new Error('Configuração não carregada');
  return result;
}

describe('Configuração segura de produção', () => {
  const previous = process.env;
  beforeEach(() => {
    process.env = { ...previous, NODE_ENV: 'production', JWT_SECRET: '', REFRESH_SECRET: '', DATABASE_URL: '' };
  });
  afterEach(() => { process.env = previous; });

  it('exige JWT_SECRET em produção', () => {
    expect(readEnvironment).toThrow('Missing environment variable: JWT_SECRET');
  });
  it('exige REFRESH_SECRET em produção', () => {
    process.env.JWT_SECRET = 'a'.repeat(64);
    expect(readEnvironment).toThrow('Missing environment variable: REFRESH_SECRET');
  });
  it.each(['short', 'change-this-placeholder-that-is-long-enough'])('recusa segredo fraco ou exemplo: %s', (secret) => {
    process.env.JWT_SECRET = secret;
    expect(readEnvironment).toThrow('JWT_SECRET must contain at least 32 characters');
  });
  it('exige segredos distintos para acesso e renovação', () => {
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.REFRESH_SECRET = process.env.JWT_SECRET;
    expect(readEnvironment).toThrow('JWT_SECRET and REFRESH_SECRET must be different');
  });
  it('não permite persistência em memória em produção', () => {
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.REFRESH_SECRET = 'b'.repeat(64);
    expect(readEnvironment).toThrow('Missing environment variable: DATABASE_URL');
  });
  it('aceita configuração explícita e não injeta credenciais de serviços', () => {
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.REFRESH_SECRET = 'b'.repeat(64);
    process.env.DATABASE_URL = 'postgresql://localhost/cryoflix_test';
    process.env.TMDB_API_KEY = '';
    process.env.ADMIN_EMAIL = '';
    process.env.ADMIN_PASSWORD = '';
    const config = readEnvironment();
    expect(config.jwtSecret).toBe(process.env.JWT_SECRET);
    expect(config.tmdb.apiKey).toBe('');
    expect(config.adminSeed).toEqual({ email: '', password: '' });
  });
  it('gera chaves efêmeras diferentes quando dev não informa segredos', () => {
    process.env.NODE_ENV = 'development';
    const first = readEnvironment();
    const second = readEnvironment();
    expect(first.jwtSecret.length).toBeGreaterThanOrEqual(32);
    expect(first.jwtSecret).not.toBe(first.refreshSecret);
    expect(first.jwtSecret).not.toBe(second.jwtSecret);
  });
});
