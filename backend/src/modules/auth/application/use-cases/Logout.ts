import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshToken: string | undefined): Promise<{ message: string }> {
    if (refreshToken) {
      await this.refreshTokenRepository.revoke(refreshToken);
    }
    return { message: 'Logout realizado' };
  }
}
