import { Router } from 'express';
import { PaymentService } from '../../application/services/PaymentService';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const paymentService = new PaymentService();
const controller = new PaymentController(paymentService);

export const paymentRoutes = Router();

paymentRoutes.post('/subscriptions', authMiddleware, safeHandler(controller.createSubscription));
paymentRoutes.get('/subscriptions/:id', authMiddleware, safeHandler(controller.getSubscription));
paymentRoutes.post('/webhooks', safeHandler(controller.webhook));

