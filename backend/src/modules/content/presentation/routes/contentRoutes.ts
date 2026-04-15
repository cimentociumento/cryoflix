import { Router } from 'express';
import { ContentService } from '../../application/services/ContentService';
import { ContentController } from '../controllers/ContentController';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';

const contentService = new ContentService();
const controller = new ContentController(contentService);

export const contentRoutes = Router();

contentRoutes.get('/', safeHandler(controller.list));
contentRoutes.get('/:id', safeHandler(controller.show));
contentRoutes.post('/', authMiddleware, safeHandler(controller.create));
contentRoutes.post('/:id/publish', authMiddleware, safeHandler(controller.publish));

