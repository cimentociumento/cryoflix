import { randomUUID } from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailService } from '../../../../shared/services/EmailService';

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (user && user.status !== 'BANNED') {
      const token = randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await this.userRepository.update(
        user.patch({
          passwordResetToken: token,
          passwordResetExpires: expires,
        }),
      );
      if (process.env.NODE_ENV !== 'test') {
        await this.emailService.sendPasswordResetEmail(user.email, token);
      }
    }
    return { message: 'Se o e-mail existir, enviaremos instruções em instantes.' };
  }
}
