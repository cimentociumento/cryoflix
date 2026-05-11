import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class VerifyEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmailVerifyToken(token);
    if (!user) {
      throw new NotFoundError('Token de verificação');
    }
    if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      throw new ValidationError('Token expirado');
    }

    await this.userRepository.update(
      user.patch({
        emailVerified: true,
        status: 'ACTIVE',
        emailVerifyToken: null,
        emailVerifyExpires: null,
      }),
    );

    return { message: 'E-mail verificado com sucesso' };
  }
}
