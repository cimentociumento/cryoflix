import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TranscodingService } from '../../application/services/TranscodingService';

export class TranscodingController {
  constructor(private readonly transcodingService: TranscodingService) {}

  enqueue = async (req: Request, res: Response): Promise<void> => {
    const { uploadJobId, renditions = ['240p', '480p', '1080p'] } = req.body;
    const job = this.transcodingService.enqueueJob(uploadJobId, renditions);
    res.status(StatusCodes.ACCEPTED).json(job);
  };

  status = async (req: Request, res: Response): Promise<void> => {
    const job = this.transcodingService.getJob(req.params.id);
    if (!job) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Job não encontrado' });
      return;
    }
    res.status(StatusCodes.OK).json(job);
  };
}

