import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SearchMovies } from '../../application/use-cases/SearchMovies';
import { GetMovieDetails } from '../../application/use-cases/GetMovieDetails';
import { GetTrendingMovies } from '../../application/use-cases/GetTrendingMovies';
import { GetRecommendations } from '../../application/use-cases/GetRecommendations';
import {
  movieIdParamSchema,
  searchMoviesSchema,
} from '../validators/movieSchemas';

export class MovieController {
  constructor(
    private readonly searchMovies: SearchMovies,
    private readonly getMovieDetails: GetMovieDetails,
    private readonly getTrendingMovies: GetTrendingMovies,
    private readonly getRecommendations: GetRecommendations,
  ) {}

  private serialize(movie: unknown) {
    const maybe = movie as { toJSON?: () => unknown };
    return typeof maybe?.toJSON === 'function' ? maybe.toJSON() : movie;
  }

  search = async (req: Request, res: Response): Promise<void> => {
    const { query, page } = searchMoviesSchema.parse(req.query);
    const result = await this.searchMovies.execute({
      query,
      page,
    });
    res.status(StatusCodes.OK).json(result.map((movie) => this.serialize(movie)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const { id } = movieIdParamSchema.parse(req.params);
    const movie = await this.getMovieDetails.execute({ id });
    const serialized = this.serialize(movie);
    
    // Log para debug - verificar se posterUrl está presente
    if (typeof serialized === 'object' && serialized !== null) {
      const movieData = serialized as any;
      if (!movieData.posterUrl && movieData.posterPath) {
        // Se posterUrl não está presente mas posterPath está, gerar
        movieData.posterUrl = `https://image.tmdb.org/t/p/w500${movieData.posterPath}`;
      }
    }
    
    res.status(StatusCodes.OK).json(serialized);
  };

  trending = async (_req: Request, res: Response): Promise<void> => {
    const movies = await this.getTrendingMovies.execute();
    res.status(StatusCodes.OK).json(movies.map((movie) => this.serialize(movie)));
  };

  recommendations = async (req: Request, res: Response): Promise<void> => {
    const { id } = movieIdParamSchema.parse(req.params);
    const movies = await this.getRecommendations.execute({ movieId: id });
    res.status(StatusCodes.OK).json(movies.map((movie) => this.serialize(movie)));
  };
}


