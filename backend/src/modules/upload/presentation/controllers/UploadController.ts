import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UploadService } from '../../application/services/UploadService';
import { signedUrlSchema, callbackSchema } from '../validators/uploadValidators';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  signedUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const payload = signedUrlSchema.parse(req.body);
    const response = this.uploadService.requestSignedUrl(payload.fileName, payload.mimeType, userId);
    res.status(StatusCodes.CREATED).json(response);
  };

  callback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const payload = callbackSchema.parse(req.body);
    const existing = this.uploadService.getJob(payload.jobId);
    if (existing.userId !== userId) {
      res.status(StatusCodes.FORBIDDEN).json({ message: 'Job pertence a outro usuário' });
      return;
    }

    const job = this.uploadService.completeJob(payload.jobId);
    res.status(StatusCodes.OK).json(job);
  };
}

