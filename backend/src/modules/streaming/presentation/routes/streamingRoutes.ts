import { Router } from 'express';
import { StreamingService } from '../../application/services/StreamingService';
import { StreamingController } from '../controllers/StreamingController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const streamingService = new StreamingService();
const controller = new StreamingController(streamingService);

export const streamingRoutes = Router();

streamingRoutes.get('/playback/:videoId', authMiddleware, safeHandler(controller.playback));
streamingRoutes.post('/sessions/:sessionId/heartbeat', safeHandler(controller.heartbeat));

