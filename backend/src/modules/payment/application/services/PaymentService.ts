import { InMemoryDatabase } from '../../../../shared/infrastructure/persistence/InMemoryDatabase';
import { randomUUID } from 'crypto';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class PaymentService {
  private readonly db = InMemoryDatabase.getInstance();

  createSubscription(userId: string, plan: 'basic' | 'standard' | 'premium') {
    const subscriptionId = randomUUID();
    const record = {
      id: subscriptionId,
      userId,
      plan,
      status: 'active' as const,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    this.db.subscriptions.set(subscriptionId, record);
    return record;
  }

  getSubscription(subscriptionId: string) {
    const subscription = this.db.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new ValidationError('Assinatura não encontrada');
    }
    return subscription;
  }

  handleWebhook(payload: Record<string, unknown>) {
    return { received: true, payload };
  }
}

