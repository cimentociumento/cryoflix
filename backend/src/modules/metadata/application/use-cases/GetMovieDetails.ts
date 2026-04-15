import { IMovieRepository } from '../../domain/repositories/IMovieRepository';
import { Movie } from '../../domain/entities/Movie';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

type Params = {
  id: number;
};

export class GetMovieDetails {
  private static CACHE_TTL = 12 * 60 * 60; // 12 hours

  constructor(
    private readonly repository: IMovieRepository,
    private readonly cache: ICacheProvider,
  ) {}

  async execute({ id }: Params): Promise<Movie> {
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('ID de filme inválido');
    }

    const cacheKey = `metadata:movie:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached && cached.tmdbId) {
      // Restaurar entidade Movie do cache
      // O cache retorna um objeto plano (JSON), precisamos reconstruir a entidade
      // Verificar se tem todos os campos necessários
      if (cached.title && cached.tmdbId) {
        return Movie.restore(
          {
            tmdbId: cached.tmdbId || cached.id,
            imdbId: cached.imdbId || undefined,
            title: cached.title,
            overview: cached.overview || '',
            releaseDate: cached.releaseDate ? new Date(cached.releaseDate) : null,
            posterPath: cached.posterPath ?? null, // Garantir null ao invés de undefined
            backdropPath: cached.backdropPath ?? null,
            voteAverage: cached.voteAverage ?? 0,
            genreIds: Array.isArray(cached.genreIds) ? cached.genreIds : [],
          },
          String(cached.tmdbId || cached.id),
        );
      }
      // Se cache está corrompido, limpar e buscar novamente
      await this.cache.delete(cacheKey);
    }

    const movie = await this.repository.findById(id);
    if (!movie) {
      throw new NotFoundError('Filme', id);
    }

    // Armazenar o JSON da entidade no cache (não a instância)
    await this.cache.set(cacheKey, movie.toJSON(), GetMovieDetails.CACHE_TTL);
    return movie;
  }
}


