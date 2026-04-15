import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PaymentService } from '../../application/services/PaymentService';
import { createSubscriptionSchema, webhookSchema } from '../validators/paymentValidators';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const payload = createSubscriptionSchema.parse(req.body);
    const subscription = this.paymentService.createSubscription(userId, payload.plan);
    res.status(StatusCodes.CREATED).json(subscription);
  };

  getSubscription = async (req: Request, res: Response): Promise<void> => {
    const subscription = this.paymentService.getSubscription(req.params.id);
    res.status(StatusCodes.OK).json(subscription);
  };

  webhook = async (req: Request, res: Response): Promise<void> => {
    const payload = webhookSchema.parse(req.body);
    const result = this.paymentService.handleWebhook(payload);
    res.status(StatusCodes.ACCEPTED).json(result);
  };
}

