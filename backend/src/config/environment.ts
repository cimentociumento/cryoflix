import dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const nodeEnv = getEnv('NODE_ENV', 'development');

// Em desenvolvimento/teste, a ausência de uma chave cria uma chave efêmera.
// Produção sempre exige chaves próprias e não aceita exemplos previsíveis.
const getSecret = (key: string): string => {
  const value = process.env[key]?.trim();
  if (value) {
    if (
      nodeEnv === 'production' &&
      (value.length < 32 || /^(change|troque|super[-_]|replace|your[-_])/i.test(value))
    ) {
      throw new Error(`${key} must contain at least 32 characters from a generated secret`);
    }
    return value;
  }
  if (nodeEnv === 'production') {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return randomBytes(48).toString('base64url');
};

const jwtSecret = getSecret('JWT_SECRET');
const refreshSecret = getSecret('REFRESH_SECRET');
if (nodeEnv === 'production' && jwtSecret === refreshSecret) {
  throw new Error('JWT_SECRET and REFRESH_SECRET must be different');
}
const databaseUrl = getEnv('DATABASE_URL', '').trim();
if (nodeEnv === 'production' && !databaseUrl) {
  throw new Error('Missing environment variable: DATABASE_URL');
}

export const env = {
  nodeEnv,
  port: Number(getEnv('PORT', '4000')),
  jwtSecret,
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '15m') as StringValue,
  refreshSecret,
  refreshExpiresIn: getEnv('REFRESH_EXPIRES_IN', '7d') as StringValue,
  cdnBaseUrl: getEnv('CDN_BASE_URL', 'https://cdn.cryoflix.local'),
  tmdb: {
    apiKey: getEnv('TMDB_API_KEY', ''),
    baseUrl: getEnv('TMDB_BASE_URL', 'https://api.themoviedb.org/3'),
  },
  superEmbed: {
    baseUrl: getEnv('SUPEREMBED_BASE_URL', 'https://multiembed.mov'),
  },
  openSubtitles: {
    apiKey: getEnv('OPENSUBTITLES_API_KEY', ''),
    username: getEnv('OPENSUBTITLES_USERNAME', 'cryoflix-demo'),
    userAgent: getEnv('OPENSUBTITLES_USER_AGENT', 'CryoFlix/1.0'),
  },
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: Number(getEnv('REDIS_PORT', '6379')),
    password: getEnv('REDIS_PASSWORD', ''),
    enabled: getEnv('REDIS_ENABLED', 'false') === 'true',
    username: getEnv('REDIS_USERNAME', 'default'),
    tlsEnabled: getEnv('REDIS_TLS_ENABLED', 'false') === 'true',
    tlsRejectUnauthorized: getEnv('REDIS_TLS_REJECT_UNAUTHORIZED', 'true') === 'true',
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
  },
  smtp: {
    host: getEnv('SMTP_HOST', ''),
    port: Number(getEnv('SMTP_PORT', '587')),
    user: getEnv('SMTP_USER', ''),
    pass: getEnv('SMTP_PASS', ''),
  },
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  adminUrl: getEnv('ADMIN_URL', 'http://localhost:5174'),
  apiUrl: getEnv('API_URL', 'http://localhost:4000'),
  adminSeed: {
    email: getEnv('ADMIN_EMAIL', ''),
    password: getEnv('ADMIN_PASSWORD', ''),
  },
};
