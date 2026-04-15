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

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '4000')),
  jwtSecret: getEnv('JWT_SECRET', 'super-secret-key'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '15m') as StringValue,
  refreshSecret: getEnv('REFRESH_SECRET', 'super-refresh-key'),
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
  },
};

