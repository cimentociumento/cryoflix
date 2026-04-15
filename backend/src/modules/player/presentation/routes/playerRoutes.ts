import { Router } from 'express';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { container } from '../../../../shared/container';
import { GetEmbedUrl } from '../../application/use-cases/GetEmbedUrl';
import { SaveWatchProgress } from '../../application/use-cases/SaveWatchProgress';
import { UrlValidator } from '../../infrastructure/security/UrlValidator';
import { PlayerController } from '../controllers/PlayerController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';

const controller = new PlayerController(
  new GetEmbedUrl(container.playerRepository, container.cacheProvider, new UrlValidator()),
  new SaveWatchProgress(container.playerRepository),
  container.playerRepository,
  container.movieRepository,
);

export const playerRoutes = Router();

playerRoutes.get('/:movieId/embed', safeHandler(controller.getEmbed));
playerRoutes.use(authMiddleware);
playerRoutes.post('/progress', safeHandler(controller.saveProgress));
playerRoutes.get('/:movieId/progress', safeHandler(controller.getProgress));


