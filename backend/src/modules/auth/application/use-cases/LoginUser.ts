import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Email } from '../../domain/value-objects/Email';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';
import { ITokenService, TokenPair } from '../services/ITokenService';
import { LoginUserDTO } from '../dtos/LoginUserDTO';

export type LoginResult = TokenPair & {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
};

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LoginUserDTO): Promise<LoginResult> {
    const email = Email.create(dto.email).value;
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new ValidationError('Credenciais inválidas');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new ValidationError('Credenciais inválidas');
    }

    const tokens = this.tokenService.generateTokens({
      sub: user.id,
      roles: user.roles,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }
}

