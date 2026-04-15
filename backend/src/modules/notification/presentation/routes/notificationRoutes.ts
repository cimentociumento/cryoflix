import { Router } from 'express';
import { NotificationService } from '../../application/services/NotificationService';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const notificationService = new NotificationService();
const controller = new NotificationController(notificationService);

export const notificationRoutes = Router();

notificationRoutes.post('/email', authMiddleware, safeHandler(controller.sendEmail));
notificationRoutes.post('/push', authMiddleware, safeHandler(controller.sendPush));

