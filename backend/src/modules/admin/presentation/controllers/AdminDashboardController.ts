import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GetDashboardStatsUseCase } from '../../application/use-cases/GetDashboardStats';

export class AdminDashboardController {
  constructor(private readonly getDashboardStats: GetDashboardStatsUseCase) {}

  dashboard = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.getDashboardStats.execute();
    res.status(StatusCodes.OK).json(stats);
  };
}
