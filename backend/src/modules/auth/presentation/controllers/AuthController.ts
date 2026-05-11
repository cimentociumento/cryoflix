import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '../../../../config/environment';
import { container } from '../../../../shared/container';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUser';
import { LoginUserUseCase } from '../../application/use-cases/LoginUser';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmail';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPassword';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPassword';
import { LogoutUseCase } from '../../application/use-cases/Logout';
import { UserService } from '../../../user/application/services/UserService';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidators';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshTokenUC: RefreshTokenUseCase,
    private readonly verifyEmailUC: VerifyEmailUseCase,
    private readonly forgotPasswordUC: ForgotPasswordUseCase,
    private readonly resetPasswordUC: ResetPasswordUseCase,
    private readonly logoutUC: LogoutUseCase,
    private readonly userService: UserService,
  ) {}

  private async persistRefreshSession(
    req: Request,
    res: Response,
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const decoded = jwt.verify(refreshToken, env.refreshSecret) as jwt.JwtPayload;
    const expiresAt = new Date((decoded.exp ?? 0) * 1000);
    await container.refreshTokenRepository.save(refreshToken, userId, expiresAt, {
      userAgent: req.get('user-agent') ?? undefined,
      ipAddress: req.ip,
    });
    res.cookie('cryoflix_refresh', refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const payload = registerSchema.parse(req.body);
    const user = await this.registerUser.execute(payload);
    res.status(StatusCodes.CREATED).json({ user: user.toSafeJSON() });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const payload = loginSchema.parse(req.body);
    const result = await this.loginUser.execute(payload);
    await this.persistRefreshSession(req, res, result.refreshToken, result.user.id);
    res.status(StatusCodes.OK).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const body = refreshSchema.parse(req.body);
    const refreshToken = body.refreshToken ?? req.cookies?.cryoflix_refresh;
    if (!refreshToken) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'Refresh token não informado' });
      return;
    }
    const tokens = await this.refreshTokenUC.execute(
      { refreshToken },
      {
        userAgent: req.get('user-agent') ?? undefined,
        ipAddress: req.ip,
      },
    );
    res.cookie('cryoflix_refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
    res.status(StatusCodes.OK).json(tokens);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.cryoflix_refresh ?? (req.body?.refreshToken as string | undefined);
    await this.logoutUC.execute(refreshToken);
    res.clearCookie('cryoflix_refresh', {
      path: '/api/auth/refresh',
    });
    res.status(StatusCodes.OK).json({ message: 'Logout realizado' });
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'Token obrigatório' });
      return;
    }
    const result = await this.verifyEmailUC.execute(token);
    res.status(StatusCodes.OK).json(result);
  };

  forgotPasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const payload = forgotPasswordSchema.parse(req.body);
    const result = await this.forgotPasswordUC.execute(payload.email);
    res.status(StatusCodes.OK).json(result);
  };

  resetPasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const payload = resetPasswordSchema.parse(req.body);
    const result = await this.resetPasswordUC.execute(payload.token, payload.newPassword);
    res.status(StatusCodes.OK).json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }
    const profile = await this.userService.getProfile(userId);
    res.status(StatusCodes.OK).json(profile);
  };
}
