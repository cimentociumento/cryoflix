import { IMovieRepository } from '../../domain/repositories/IMovieRepository';
import { Movie } from '../../domain/entities/Movie';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';
import { logger } from '../../../../shared/utils/logger';

export class GetTrendingMovies {
  private static CACHE_TTL = 15 * 60; // 15 minutes

  constructor(
    private readonly repository: IMovieRepository,
    private readonly cache: ICacheProvider,
  ) {}

  async execute(): Promise<Movie[]> {
    const cacheKey = 'metadata:trending';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      // Restaurar entidades Movie do cache
      return cached.map((item: any) => {
        if (item instanceof Movie) {
          return item;
        }
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

    const movies = await this.repository.getTrending();
    logger.debug({ count: movies.length }, 'GetTrendingMovies: resultados da busca');
    
    // Armazenar JSONs no cache, não instâncias
    if (movies.length > 0) {
      await this.cache.set(
        cacheKey,
        movies.map((movie) => movie.toJSON()),
        GetTrendingMovies.CACHE_TTL,
      );
    }
    
    return movies;
  }
}


