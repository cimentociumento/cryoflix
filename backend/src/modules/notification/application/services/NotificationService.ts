import { logger } from '../../../../shared/utils/logger';

export class NotificationService {
  sendEmail(to: string, subject: string, body: string) {
    logger.info({ to, subject }, 'Email enfileirado');
    return { to, subject, body, status: 'queued' };
  }

  sendPush(token: string, message: string) {
    logger.info({ token }, 'Push enfileirado');
    return { token, message, status: 'queued' };
  }
}

