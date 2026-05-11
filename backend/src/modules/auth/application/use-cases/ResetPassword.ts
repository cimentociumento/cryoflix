import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundError('Token de redefinição');
    }
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new ValidationError('Token expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(
      user.patch({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      }),
    );

    await this.refreshTokenRepository.revokeAllByUser(user.id);

    return { message: 'Senha alterada com sucesso' };
  }
}
