import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenService, TokenPair } from '../services/ITokenService';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<TokenPair> {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    const userId = payload.sub as string;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ValidationError('Usuário não encontrado');
    }

    return this.tokenService.generateTokens({ sub: user.id, roles: user.roles });
  }
}

