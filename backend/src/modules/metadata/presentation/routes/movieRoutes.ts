import { Router } from 'express';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { container } from '../../../../shared/container';
import { SearchMovies } from '../../application/use-cases/SearchMovies';
import { GetMovieDetails } from '../../application/use-cases/GetMovieDetails';
import { GetTrendingMovies } from '../../application/use-cases/GetTrendingMovies';
import { GetRecommendations } from '../../application/use-cases/GetRecommendations';
import { MovieController } from '../controllers/MovieController';

const controller = new MovieController(
  new SearchMovies(container.movieRepository, container.cacheProvider),
  new GetMovieDetails(container.movieRepository, container.cacheProvider),
  new GetTrendingMovies(container.movieRepository, container.cacheProvider),
  new GetRecommendations(container.movieRepository, container.cacheProvider),
);

export const movieRoutes = Router();

movieRoutes.get('/search', safeHandler(controller.search));
movieRoutes.get('/trending', safeHandler(controller.trending));
movieRoutes.get('/:id/recommendations', safeHandler(controller.recommendations));
movieRoutes.get('/:id', safeHandler(controller.show));


