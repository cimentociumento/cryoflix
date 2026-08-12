import dotenv from 'dotenv';
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

// JWT_SECRET/REFRESH_SECRET têm fallback só fora de produção (dev/test
// rodam sem .env neste repo). Em produção, um segredo ausente derruba o
// boot em vez de assinar tokens com uma string pública conhecida.
const getSecret = (key: string, devFallback: string): string => {
  const value = process.env[key];
  if (value) {
    return value;
  }
  if (nodeEnv === 'production') {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return devFallback;
};

export const env = {
  nodeEnv,
  port: Number(getEnv('PORT', '4000')),
  jwtSecret: getSecret('JWT_SECRET', 'super-secret-key'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '15m') as StringValue,
  refreshSecret: getSecret('REFRESH_SECRET', 'super-refresh-key'),
  refreshExpiresIn: getEnv('REFRESH_EXPIRES_IN', '7d') as StringValue,
  cdnBaseUrl: getEnv('CDN_BASE_URL', 'https://cdn.cryoflix.local'),
  tmdb: {
    apiKey: getEnv('TMDB_API_KEY', 'f99c004fcfba174823fb96e5b41ef707'),
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
    email: getEnv('ADMIN_EMAIL', 'admin@cryoflix.io'),
    password: getEnv('ADMIN_PASSWORD', 'Admin@CryoFlix2024!'),
  },
};
