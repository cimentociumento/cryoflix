import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { GetAuditLogsUseCase } from '../../application/use-cases/GetAuditLogs';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export class AdminAuditController {
  constructor(private readonly getAuditLogs: GetAuditLogsUseCase) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const q = querySchema.parse(req.query);
    const result = await this.getAuditLogs.execute({
      page: q.page,
      limit: q.limit,
      userId: q.userId,
      action: q.action,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
    });
    res.status(StatusCodes.OK).json(result);
  };
}
