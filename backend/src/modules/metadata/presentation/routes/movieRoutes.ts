import { Router } from 'express';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { metadataRateLimiter } from '../../../../shared/infrastructure/middlewares/rateLimiter';
import { container } from '../../../../shared/container';
import { SearchMovies } from '../../application/use-cases/SearchMovies';
import { GetMovieDetails } from '../../application/use-cases/GetMovieDetails';
import { GetTrendingMovies } from '../../application/use-cases/GetTrendingMovies';
import { GetRecommendations } from '../../application/use-cases/GetRecommendations';
import { GetBrazilianDubInfo } from '../../application/use-cases/GetBrazilianDubInfo';
import { MovieController } from '../controllers/MovieController';

const controller = new MovieController(
  new SearchMovies(container.movieRepository, container.cacheProvider, container.blockedMoviesFilter),
  new GetMovieDetails(container.movieRepository, container.cacheProvider, container.blockedMoviesFilter),
  new GetTrendingMovies(container.movieRepository, container.cacheProvider, container.blockedMoviesFilter),
  new GetRecommendations(container.movieRepository, container.cacheProvider, container.blockedMoviesFilter),
  new GetBrazilianDubInfo(container.tmdbClient, container.cacheProvider),
);

export const movieRoutes = Router();

movieRoutes.use(metadataRateLimiter);

movieRoutes.get('/search', safeHandler(controller.search));
movieRoutes.get('/trending', safeHandler(controller.trending));
movieRoutes.get('/:id/recommendations', safeHandler(controller.recommendations));
movieRoutes.get('/:id/brazilian-dub', safeHandler(controller.brazilianDub));
movieRoutes.get('/:id', safeHandler(controller.show));


