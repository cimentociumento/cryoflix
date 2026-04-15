import { IMovieRepository } from '../../domain/repositories/IMovieRepository';
import { TMDbClient } from '../http/TMDbClient';
import { Movie } from '../../domain/entities/Movie';
import { TMDbAdapter } from '../adapters/TMDbAdapter';

export class MovieRepository implements IMovieRepository {
  constructor(private readonly client: TMDbClient) {}

  async search(query: string, page: number): Promise<Movie[]> {
    const results = await this.client.searchMovies(query, page);
    return results.map(TMDbAdapter.toEntity);
  }

  async findById(id: number): Promise<Movie | null> {
    const movie = await this.client.getMovieDetails(id);
    return movie ? TMDbAdapter.toEntity(movie) : null;
  }

  async getTrending(): Promise<Movie[]> {
    const movies = await this.client.getTrending();
    return movies.map(TMDbAdapter.toEntity);
  }

  async getRecommendations(movieId: number): Promise<Movie[]> {
    const movies = await this.client.getRecommendations(movieId);
    return movies.map(TMDbAdapter.toEntity);
  }
}


