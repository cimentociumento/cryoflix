import { Router } from 'express';
import { RecommendationService } from '../../application/services/RecommendationService';
import { RecommendationController } from '../controllers/RecommendationController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const recommendationService = new RecommendationService();
const controller = new RecommendationController(recommendationService);

export const recommendationRoutes = Router();

recommendationRoutes.get('/', authMiddleware, safeHandler(controller.list));
recommendationRoutes.get('/:userId', authMiddleware, safeHandler(controller.list));
recommendationRoutes.post('/feedback', authMiddleware, safeHandler(controller.feedback));

