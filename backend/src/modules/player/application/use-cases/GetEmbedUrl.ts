import { ValidationError } from '../../../../shared/domain/errors/ValidationError';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';
import { IPlayerRepository } from '../../domain/repositories/IPlayerRepository';
import { VideoSource } from '../../domain/entities/VideoSource';
import { UrlValidator } from '../../infrastructure/security/UrlValidator';

type Params = {
  movieId: number;
  imdbId?: string;
};

export class GetEmbedUrl {
  private static CACHE_TTL = 6 * 60 * 60; // 6 hours

  constructor(
    private readonly repository: IPlayerRepository,
    private readonly cache: ICacheProvider,
    private readonly urlValidator: UrlValidator,
  ) {}

  async execute({ movieId, imdbId }: Params): Promise<VideoSource> {
    if (!Number.isFinite(movieId) || movieId <= 0) {
      throw new ValidationError('Identificador inválido');
    }

    // Incluir imdbId na chave do cache para diferenciar quando disponível
    const cacheKey = imdbId 
      ? `player:embed:${movieId}:imdb:${imdbId}` 
      : `player:embed:${movieId}`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      const hydrated = new VideoSource(
        cached.movieId,
        cached.embedUrl,
        cached.quality,
        cached.isAvailable,
        cached.createdAt ? new Date(cached.createdAt) : new Date(),
      );
      if (!hydrated.isExpired()) {
        return hydrated;
      }
    }

    const source = await this.repository.getEmbedSource(movieId, imdbId);

    if (!this.urlValidator.isValid(source.embedUrl)) {
      throw new ValidationError('URL inválida para reprodução');
    }

    await this.cache.set(cacheKey, source, GetEmbedUrl.CACHE_TTL);
    return source;
  }
}


