import { Router } from 'express';
import { TranscodingService } from '../../application/services/TranscodingService';
import { TranscodingController } from '../controllers/TranscodingController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const transcodingService = new TranscodingService();
const controller = new TranscodingController(transcodingService);

export const transcodingRoutes = Router();

transcodingRoutes.post('/jobs', authMiddleware, safeHandler(controller.enqueue));
transcodingRoutes.get('/jobs/:id', authMiddleware, safeHandler(controller.status));

