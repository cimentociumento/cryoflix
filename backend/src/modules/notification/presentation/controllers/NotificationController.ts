import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../../application/services/NotificationService';
import { sendEmailSchema, sendPushSchema } from '../validators/notificationValidators';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  sendEmail = async (req: Request, res: Response): Promise<void> => {
    const payload = sendEmailSchema.parse(req.body);
    const result = this.notificationService.sendEmail(payload.to, payload.subject, payload.body);
    res.status(StatusCodes.ACCEPTED).json(result);
  };

  sendPush = async (req: Request, res: Response): Promise<void> => {
    const payload = sendPushSchema.parse(req.body);
    const result = this.notificationService.sendPush(payload.token, payload.message);
    res.status(StatusCodes.ACCEPTED).json(result);
  };
}

