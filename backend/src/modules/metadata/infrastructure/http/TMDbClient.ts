import { HttpClient } from '../../../../shared/infrastructure/http/HttpClient';
import { env } from '../../../../config/environment';
import { logger } from '../../../../shared/utils/logger';

type SearchResponse = {
  results: TMDbMovie[];
};

type TrendingResponse = {
  results: TMDbMovie[];
};

type RecommendationResponse = {
  results: TMDbMovie[];
};

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

const mockMovies: TMDbMovie[] = [
  {
    id: 1,
    title: 'Mocked Movie',
    overview: 'Filme fictício para ambiente local.',
    release_date: '2024-01-01',
    poster_path: null,
    backdrop_path: null,
    vote_average: 8,
    genre_ids: [12, 18],
  },
];

export class TMDbClient {
  private readonly http = env.tmdb.apiKey
    ? HttpClient.create({
        baseURL: env.tmdb.baseUrl,
        params: {
          api_key: env.tmdb.apiKey,
          language: 'pt-BR',
        },
      })
    : null;

  constructor() {
    if (!env.tmdb.apiKey) {
      logger.warn('TMDB_API_KEY não configurada - usando dados mock');
    } else {
      logger.info('TMDb Client inicializado com API key');
    }
  }

  async searchMovies(query: string, page: number): Promise<TMDbMovie[]> {
    const http = this.http;
    if (!http) {
      return mockMovies;
    }
    try {
      logger.debug({ query, page }, 'TMDb searchMovies: buscando filmes');
      const response = await http.get<SearchResponse>('/search/movie', {
        params: { query, page },
      });
      // Verificar se results existe e é um array
      if (!response || !response.results || !Array.isArray(response.results)) {
        logger.warn({ query, page, response }, 'TMDb searchMovies: resposta inválida');
        return [];
      }
      logger.info({ query, count: response.results.length }, 'TMDb searchMovies: filmes encontrados');
      return response.results;
    } catch (error: any) {
      logger.error({
        query,
        page,
        message: error.message,
        status: error.status,
        data: error.cause,
      }, 'TMDb searchMovies error');
      // Retornar array vazio ao invés de lançar erro
      return [];
    }
  }

  async getMovieDetails(id: number): Promise<TMDbMovie | null> {
    const http = this.http;
    if (!http) {
      return mockMovies.find((movie) => movie.id === id) ?? mockMovies[0];
    }
    try {
      // Usar append_to_response para buscar external_ids (inclui IMDB ID)
      // Isso é importante para o SuperEmbed funcionar melhor
      // A resposta vem com external_ids como um objeto aninhado
      type MovieResponse = TMDbMovie & {
        external_ids?: TMDbExternalIds;
      };
      // Quando append_to_response é usado, a resposta vem com external_ids como objeto separado
      // A estrutura é: { id, title, ..., external_ids: { imdb_id, ... } }
      const response = await http.get<any>(`/movie/${id}`, {
        params: { append_to_response: 'external_ids' },
      });
      
      // Verificar se a resposta é válida
      if (!response || !response.id) {
        logger.warn({ id, response }, 'TMDb getMovieDetails: resposta inválida');
        return null;
      }
      
      // Extrair external_ids da resposta (pode vir como objeto separado quando append_to_response é usado)
      const externalIds = response.external_ids || {};
      
      // Mapear a resposta para o tipo esperado
      const movie: TMDbMovie = {
        id: response.id,
        title: response.title || '',
        overview: response.overview || '',
        release_date: response.release_date,
        poster_path: response.poster_path,
        backdrop_path: response.backdrop_path,
        vote_average: response.vote_average || 0,
        genre_ids: response.genre_ids || [],
        external_ids: {
          imdb_id: externalIds.imdb_id || null,
          facebook_id: externalIds.facebook_id || null,
          instagram_id: externalIds.instagram_id || null,
          twitter_id: externalIds.twitter_id || null,
          wikidata_id: externalIds.wikidata_id || null,
        },
      };
      
      logger.debug({ movieId: id, imdbId: movie.external_ids?.imdb_id }, 'TMDb getMovieDetails: filme encontrado');
      return movie;
    } catch (error: any) {
      logger.error({
        id,
        message: error.message,
        status: error.status,
        data: error.cause,
      }, 'TMDb getMovieDetails error');
      return null;
    }
  }

  async getTrending(): Promise<TMDbMovie[]> {
    const http = this.http;
    if (!http) {
      return mockMovies;
    }
    try {
      const response = await http.get<TrendingResponse>('/trending/movie/day');
      if (!response || !response.results || !Array.isArray(response.results)) {
        logger.warn({ response }, 'TMDb getTrending: resposta inválida');
        return [];
      }
      logger.info({ count: response.results.length }, 'TMDb getTrending: filmes encontrados');
      return response.results;
    } catch (error: any) {
      logger.error({
        message: error.message,
        status: error.status,
        data: error.cause,
      }, 'TMDb getTrending error');
      return [];
    }
  }

  async getRecommendations(id: number): Promise<TMDbMovie[]> {
    const http = this.http;
    if (!http) {
      return mockMovies;
    }
    try {
      const response = await http.get<RecommendationResponse>(`/movie/${id}/recommendations`);
      if (!response || !response.results || !Array.isArray(response.results)) {
        logger.warn({ id, response }, 'TMDb getRecommendations: resposta inválida');
        return [];
      }
      logger.info({ id, count: response.results.length }, 'TMDb getRecommendations: recomendações encontradas');
      return response.results;
    } catch (error: any) {
      logger.error({
        id,
        message: error.message,
        status: error.status,
        data: error.cause,
      }, 'TMDb getRecommendations error');
      return [];
    }
  }
}


