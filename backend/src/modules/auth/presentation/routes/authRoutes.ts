import { Router } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUser';
import { LoginUserUseCase } from '../../application/use-cases/LoginUser';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken';
import { AuthController } from '../controllers/AuthController';
import { safeHandler } from '../../../../shared/utils/safeHandler';
import { container } from '../../../../shared/container';
import { loginRateLimiter } from '../../../../shared/infrastructure/middlewares/rateLimiter';

const registerUser = new RegisterUserUseCase(container.userRepository);
const loginUser = new LoginUserUseCase(container.userRepository, container.tokenService);
const refreshToken = new RefreshTokenUseCase(container.userRepository, container.tokenService);

const controller = new AuthController(registerUser, loginUser, refreshToken);

export const authRoutes = Router();

authRoutes.post('/register', safeHandler(controller.register));
authRoutes.post('/login', loginRateLimiter, safeHandler(controller.login));
authRoutes.post('/refresh', safeHandler(controller.refresh));

