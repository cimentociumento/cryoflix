import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUser';
import { LoginUserUseCase } from '../../application/use-cases/LoginUser';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken';
import { registerSchema, loginSchema, refreshSchema } from '../validators/authValidators';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const payload = registerSchema.parse(req.body);
    const user = await this.registerUser.execute(payload);
    res.status(StatusCodes.CREATED).json({ user: user.toSafeJSON() });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const payload = loginSchema.parse(req.body);
    const result = await this.loginUser.execute(payload);
    res.status(StatusCodes.OK).json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const payload = refreshSchema.parse(req.body);
    const tokens = await this.refreshToken.execute(payload);
    res.status(StatusCodes.OK).json(tokens);
  };
}

