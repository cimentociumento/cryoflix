import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AnalyticsService } from '../../application/services/AnalyticsService';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  metrics = async (_req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json(this.analyticsService.getMetrics());
  };

  ingest = async (req: Request, res: Response): Promise<void> => {
    const { event, userId, data } = req.body;
    const entry = this.analyticsService.recordEvent(event, { userId, data });
    res.status(StatusCodes.CREATED).json(entry);
  };
}

