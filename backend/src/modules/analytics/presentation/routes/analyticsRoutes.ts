import { Router } from 'express';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const analyticsService = new AnalyticsService();
const controller = new AnalyticsController(analyticsService);

export const analyticsRoutes = Router();

analyticsRoutes.get('/metrics', safeHandler(controller.metrics));
analyticsRoutes.post('/events', safeHandler(controller.ingest));

