import { ICacheProvider } from './ICacheProvider';
import { RedisCacheProvider } from './RedisCacheProvider';
import { InMemoryCacheProvider } from './InMemoryCacheProvider';
import { logger } from '../../utils/logger';
import { env } from '../../../config/environment';

let cacheProviderInstance: ICacheProvider | null = null;

export const getCacheProvider = (): ICacheProvider => {
  if (cacheProviderInstance) {
    return cacheProviderInstance;
  }

  // Tentar usar Redis se habilitado
  if (env.redis.enabled) {
    logger.info('Usando Redis como cache provider');
    cacheProviderInstance = new RedisCacheProvider();
  } else {
    logger.info('Usando cache em memória (Redis não habilitado)');
    cacheProviderInstance = new InMemoryCacheProvider();
  }

  return cacheProviderInstance;
};

