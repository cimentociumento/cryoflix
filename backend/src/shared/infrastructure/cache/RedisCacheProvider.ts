import { ICacheProvider } from './ICacheProvider';
import { logger } from '../../utils/logger';
import { env } from '../../../config/environment';

let RedisClient: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ioredis = require('ioredis');
  // ioredis exporta a classe Redis como default ou named export
  RedisClient = ioredis.default || ioredis;
} catch {
  // Redis não está instalado, será usado fallback
}

export class RedisCacheProvider implements ICacheProvider {
  private client: import('ioredis').Redis | null = null;
  private isAvailable = false;

  constructor() {
    if (!RedisClient) {
      logger.warn('Redis não disponível, usando cache em memória');
      return;
    }

    try {
      this.client = new RedisClient({
        host: env.redis.host,
        port: env.redis.port,
        username: env.redis.username || undefined,
        password: env.redis.password || undefined,
        tls: env.redis.tlsEnabled
          ? { rejectUnauthorized: env.redis.tlsRejectUnauthorized }
          : undefined,
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.error('Redis: falha após 3 tentativas, desabilitando');
            this.isAvailable = false;
            return null; // Para retry
          }
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      if (this.client) {
        this.client.on('error', (err) => {
          logger.error({ err }, 'Redis error');
          this.isAvailable = false;
        });

        this.client.on('connect', () => {
          logger.info('Redis conectado');
          this.isAvailable = true;
        });

        // Tentar conectar, mas não bloquear se falhar
        this.client.connect().catch(() => {
          logger.warn('Redis: falha na conexão inicial, usando fallback');
          this.isAvailable = false;
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Redis: erro ao inicializar, usando fallback');
      this.isAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (err) {
      logger.warn({ err, key }, 'Redis: erro ao buscar chave');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
    if (!this.isAvailable || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlInSeconds, serialized);
    } catch (err) {
      logger.warn({ err, key }, 'Redis: erro ao salvar chave');
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (err) {
      logger.warn({ err, key }, 'Redis: erro ao deletar chave');
    }
  }
}

