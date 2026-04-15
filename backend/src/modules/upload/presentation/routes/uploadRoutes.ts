import { Router } from 'express';
import { UploadService } from '../../application/services/UploadService';
import { UploadController } from '../controllers/UploadController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const uploadService = new UploadService();
const controller = new UploadController(uploadService);

export const uploadRoutes = Router();

uploadRoutes.post('/signed-url', authMiddleware, safeHandler(controller.signedUrl));
uploadRoutes.post('/callback', safeHandler(controller.callback));

