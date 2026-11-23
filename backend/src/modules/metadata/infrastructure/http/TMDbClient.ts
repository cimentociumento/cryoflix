import { z } from 'zod';
import { HttpClient } from '../../../../shared/infrastructure/http/HttpClient';
import { HttpClientError } from '../../../../shared/infrastructure/http/HttpClientError';
import { env } from '../../../../config/environment';
import { logger } from '../../../../shared/utils/logger';

export type TMDbExternalIds = {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
};

export type TMDbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  genre_ids: number[];
  external_ids?: TMDbExternalIds;
};

const movieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  overview: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  vote_average: z.number().optional(),
  genre_ids: z.array(z.number().int()).optional(),
  genres: z.array(z.object({ id: z.number().int() })).optional(),
  external_ids: z.object({
    imdb_id: z.string().nullable().optional(),
    facebook_id: z.string().nullable().optional(),
    instagram_id: z.string().nullable().optional(),
    twitter_id: z.string().nullable().optional(),
    wikidata_id: z.string().nullable().optional(),
  }).optional(),
});

const unavailableMessage = 'O serviço de filmes está indisponível. Tente novamente em instantes.';
const invalidResponseMessage = 'O serviço de filmes retornou uma resposta inválida. Tente novamente.';

export class TMDbClient {
  constructor(
    private readonly http: Pick<HttpClient, 'get'> | null = env.tmdb.apiKey
      ? HttpClient.create({
          baseURL: env.tmdb.baseUrl,
          // Responder ao frontend antes do timeout de cinco segundos dele.
          timeout: 4000,
          params: { api_key: env.tmdb.apiKey, language: 'pt-BR' },
        })
      : null,
  ) {}

  private async request(
    path: string,
    params?: Record<string, string | number>,
    movieCanBeMissing = false,
  ): Promise<unknown> {
    if (!this.http) {
      throw new HttpClientError(unavailableMessage, 503);
    }

    try {
      return await this.http.get<unknown>(path, { params });
    } catch (error) {
      const status = error instanceof HttpClientError ? error.status : undefined;
      logger.warn({ path, upstreamStatus: status }, 'Falha ao consultar o serviço de filmes');

      if (movieCanBeMissing && status === 404) {
        throw new HttpClientError('Filme não encontrado.', 404);
      }

      // Uma chave inválida e o limite do provedor são problemas da integração,
      // não da sessão do usuário. Não repassar 401 para renovar o login.
      const unavailable = !status || status >= 500 || [401, 403, 429].includes(status);
      throw new HttpClientError(
        unavailable ? unavailableMessage : invalidResponseMessage,
        unavailable ? 503 : 502,
      );
    }
  }

  private parseMovie(value: unknown): TMDbMovie {
    const result = movieSchema.safeParse(value);
    if (!result.success) {
      throw new HttpClientError(invalidResponseMessage, 502);
    }
    const movie = result.data;
    return {
      ...movie,
      overview: movie.overview ?? '',
      release_date: movie.release_date ?? undefined,
      vote_average: movie.vote_average ?? 0,
      genre_ids: movie.genre_ids ?? movie.genres?.map((genre) => genre.id) ?? [],
    };
  }

  private parseList(response: unknown): TMDbMovie[] {
    const result = z.object({ results: z.array(z.unknown()) }).safeParse(response);
    if (!result.success) {
      throw new HttpClientError(invalidResponseMessage, 502);
    }
    return result.data.results.map((movie) => this.parseMovie(movie));
  }

  async searchMovies(query: string, page: number): Promise<TMDbMovie[]> {
    return this.parseList(await this.request('/search/movie', { query, page }));
  }

  async getMovieDetails(id: number): Promise<TMDbMovie | null> {
    let response: unknown;
    try {
      response = await this.request('/movie/' + id, { append_to_response: 'external_ids' }, true);
    } catch (error) {
      if (error instanceof HttpClientError && error.status === 404) return null;
      throw error;
    }
    const movie = this.parseMovie(response);
    if (movie.id !== id) {
      throw new HttpClientError(invalidResponseMessage, 502);
    }
    return movie;
  }

  async getTrending(): Promise<TMDbMovie[]> {
    return this.parseList(await this.request('/trending/movie/day'));
  }

  async getRecommendations(id: number): Promise<TMDbMovie[]> {
    return this.parseList(await this.request('/movie/' + id + '/recommendations', undefined, true));
  }
}
