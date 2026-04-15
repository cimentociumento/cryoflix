import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../../application/services/UserService';
import { updatePreferencesSchema } from '../validators/userValidators';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const profile = await this.userService.getProfile(userId);
    res.status(StatusCodes.OK).json(profile);
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const payload = updatePreferencesSchema.parse(req.body);
    const result = await this.userService.updatePreferences(userId, payload.preferences);
    res.status(StatusCodes.OK).json(result);
  };

  history = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const history = await this.userService.getHistory(id);
    res.status(StatusCodes.OK).json({ history });
  };
}

