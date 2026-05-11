import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { ITokenService, TokenPair } from '../services/ITokenService';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO';
import { UnauthorizedError } from '../../../../shared/domain/errors/UnauthorizedError';
import { env } from '../../../../config/environment';
import type { RefreshTokenMeta } from '../../domain/repositories/IRefreshTokenRepository';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(dto: RefreshTokenDTO, meta?: RefreshTokenMeta): Promise<TokenPair> {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findByToken(dto.refreshToken);

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedError('Sessão inválida');
    }

    const userId = payload.sub as string;
    if (stored.userId !== userId) {
      throw new UnauthorizedError('Sessão inválida');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    await this.refreshTokenRepository.revoke(dto.refreshToken);

    const tokens = this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
    });

    const decoded = jwt.verify(tokens.refreshToken, env.refreshSecret) as jwt.JwtPayload;
    const expiresAt = new Date((decoded.exp ?? 0) * 1000);

    await this.refreshTokenRepository.save(tokens.refreshToken, user.id, expiresAt, meta);

    return tokens;
  }
}
