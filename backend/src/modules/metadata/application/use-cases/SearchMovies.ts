import { IMovieRepository } from '../../domain/repositories/IMovieRepository';
import { Movie } from '../../domain/entities/Movie';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';
import { logger } from '../../../../shared/utils/logger';

type Params = {
  query: string;
  page?: number;
};

export class SearchMovies {
  private static CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly repository: IMovieRepository,
    private readonly cache: ICacheProvider,
  ) {}

  async execute({ query, page = 1 }: Params): Promise<Movie[]> {
    const normalized = query.trim();
    if (!normalized) {
      return [];
    }

    const cacheKey = `metadata:search:${normalized.toLowerCase()}:${page}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      // Restaurar entidades Movie do cache
      return cached.map((item: any) => {
        if (item instanceof Movie) {
          return item;
        }
        // Restaurar do JSON
        return Movie.restore(
          {
            tmdbId: item.tmdbId || item.id,
            imdbId: item.imdbId || undefined,
            title: item.title,
            overview: item.overview,
            releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
            posterPath: item.posterPath,
            backdropPath: item.backdropPath,
            voteAverage: item.voteAverage,
            genreIds: item.genreIds,
          },
          String(item.tmdbId || item.id),
        );
      });
    }

    const result = await this.repository.search(normalized, page);
    
    logger.debug({ query: normalized, page, count: result.length }, 'SearchMovies: resultados da busca');
    
    // Armazenar JSONs no cache, não instâncias
    if (result.length > 0) {
      await this.cache.set(
        cacheKey,
        result.map((movie) => movie.toJSON()),
        SearchMovies.CACHE_TTL,
      );
    } else {
      logger.warn({ query: normalized, page }, 'SearchMovies: nenhum resultado encontrado');
    }
    
    return result;
  }
}


