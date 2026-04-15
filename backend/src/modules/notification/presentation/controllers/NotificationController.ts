import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../../application/services/NotificationService';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  sendEmail = async (req: Request, res: Response): Promise<void> => {
    const { to, subject, body } = req.body;
    const result = this.notificationService.sendEmail(to, subject, body);
    res.status(StatusCodes.ACCEPTED).json(result);
  };

  sendPush = async (req: Request, res: Response): Promise<void> => {
    const { token, message } = req.body;
    const result = this.notificationService.sendPush(token, message);
    res.status(StatusCodes.ACCEPTED).json(result);
  };
}

