import { Router } from 'express';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { authorize } from '../../../../shared/infrastructure/middlewares/authorize';

const analyticsService = new AnalyticsService();
const controller = new AnalyticsController(analyticsService);

export const analyticsRoutes = Router();

analyticsRoutes.get('/metrics', authMiddleware, authorize('ADMIN'), safeHandler(controller.metrics));
analyticsRoutes.post('/events', authMiddleware, safeHandler(controller.ingest));

