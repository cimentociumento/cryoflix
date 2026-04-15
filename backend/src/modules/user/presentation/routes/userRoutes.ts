import { Router } from 'express';
import { UserService } from '../../application/services/UserService';
import { container } from '../../../../shared/container';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../../../auth/infrastructure/middlewares/authMiddleware';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const userService = new UserService(container.userRepository);
const controller = new UserController(userService);

export const userRoutes = Router();

userRoutes.get('/me', authMiddleware, safeHandler(controller.me));
userRoutes.patch('/me/preferences', authMiddleware, safeHandler(controller.updatePreferences));
userRoutes.get('/:id/history', authMiddleware, safeHandler(controller.history));

