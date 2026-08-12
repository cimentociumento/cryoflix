import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { recordEventSchema } from '../validators/analyticsValidators';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  metrics = async (_req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json(this.analyticsService.getMetrics());
  };

  ingest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }
    const payload = recordEventSchema.parse(req.body);
    const entry = this.analyticsService.recordEvent(payload.event, { userId, data: payload.data });
    res.status(StatusCodes.CREATED).json(entry);
  };
}

