import { Router } from 'express';
import { ContentService } from '../../application/services/ContentService';
import { ContentController } from '../controllers/ContentController';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { authorize } from '../../../../shared/infrastructure/middlewares/authorize';

const contentService = new ContentService();
const controller = new ContentController(contentService);

export const contentRoutes = Router();

contentRoutes.get('/', safeHandler(controller.list));
contentRoutes.get('/:id', safeHandler(controller.show));
contentRoutes.post('/', authMiddleware, authorize('ADMIN'), safeHandler(controller.create));
contentRoutes.post(
  '/:id/publish',
  authMiddleware,
  authorize('ADMIN'),
  safeHandler(controller.publish),
);

