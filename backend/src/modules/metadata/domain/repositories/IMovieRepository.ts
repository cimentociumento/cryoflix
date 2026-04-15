import { Movie } from '../entities/Movie';

export interface IMovieRepository {
  search(query: string, page: number): Promise<Movie[]>;
  findById(id: number): Promise<Movie | null>;
  getTrending(): Promise<Movie[]>;
  getRecommendations(movieId: number): Promise<Movie[]>;
}


