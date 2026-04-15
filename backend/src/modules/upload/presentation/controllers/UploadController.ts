import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UploadService } from '../../application/services/UploadService';
import { signedUrlSchema, callbackSchema } from '../validators/uploadValidators';

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  signedUrl = async (req: Request, res: Response): Promise<void> => {
    const payload = signedUrlSchema.parse(req.body);
    const response = this.uploadService.requestSignedUrl(payload.fileName, payload.mimeType);
    res.status(StatusCodes.CREATED).json(response);
  };

  callback = async (req: Request, res: Response): Promise<void> => {
    const payload = callbackSchema.parse(req.body);
    const job = this.uploadService.completeJob(payload.jobId);
    res.status(StatusCodes.OK).json(job);
  };
}

