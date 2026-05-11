import { Router } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUser';
import { LoginUserUseCase } from '../../application/use-cases/LoginUser';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmail';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPassword';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPassword';
import { LogoutUseCase } from '../../application/use-cases/Logout';
import { AuthController } from '../controllers/AuthController';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { container } from '../../../../shared/container';
import {
  loginRateLimiter,
  authSensitiveRateLimiter,
} from '../../../../shared/infrastructure/middlewares/rateLimiter';
import { authMiddleware } from '../../infrastructure/middlewares/authMiddleware';
import { UserService } from '../../../user/application/services/UserService';

const userService = new UserService(container.userRepository);

const registerUser = new RegisterUserUseCase(container.userRepository, container.emailService);
const loginUser = new LoginUserUseCase(container.userRepository, container.tokenService);
const refreshToken = new RefreshTokenUseCase(
  container.userRepository,
  container.tokenService,
  container.refreshTokenRepository,
);
const verifyEmail = new VerifyEmailUseCase(container.userRepository);
const forgotPassword = new ForgotPasswordUseCase(container.userRepository, container.emailService);
const resetPassword = new ResetPasswordUseCase(container.userRepository, container.refreshTokenRepository);
const logout = new LogoutUseCase(container.refreshTokenRepository);

const controller = new AuthController(
  registerUser,
  loginUser,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  userService,
);

export const authRoutes = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [auth]
 *     summary: Registrar usuário
 */
authRoutes.post('/register', safeHandler(controller.register));
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: Login
 */
authRoutes.post('/login', loginRateLimiter, safeHandler(controller.login));
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [auth]
 *     summary: Renovar tokens
 */
authRoutes.post('/refresh', safeHandler(controller.refresh));
authRoutes.post('/logout', authMiddleware, safeHandler(controller.logout));
authRoutes.get('/verify-email', safeHandler(controller.verifyEmail));
authRoutes.post(
  '/forgot-password',
  authSensitiveRateLimiter,
  safeHandler(controller.forgotPasswordHandler),
);
authRoutes.post('/reset-password', authSensitiveRateLimiter, safeHandler(controller.resetPasswordHandler));
authRoutes.get('/me', authMiddleware, safeHandler(controller.me));
