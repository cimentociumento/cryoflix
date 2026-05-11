import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Email } from '../../domain/value-objects/Email';
import { UnauthorizedError } from '../../../../shared/domain/errors/UnauthorizedError';
import { ITokenService, TokenPair } from '../services/ITokenService';
import { LoginUserDTO } from '../dtos/LoginUserDTO';

export type LoginResult = TokenPair & {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    role: string;
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
      throw new UnauthorizedError('Credenciais inválidas');
    }

    if (user.deletedAt) {
      throw new UnauthorizedError('Conta não encontrada');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(`Conta bloqueada. Tente novamente em ${minutes} minuto(s).`);
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Conta suspensa. Entre em contato com o suporte.');
    }
    if (user.status === 'BANNED') {
      throw new UnauthorizedError('Conta banida permanentemente.');
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedError(
        'Verifique seu e-mail antes de fazer login.',
        'EMAIL_NOT_VERIFIED',
      );
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      const failed = user.failedLoginAttempts + 1;
      const lockedUntil =
        failed >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : user.lockedUntil;
      await this.userRepository.update(user.patch({ failedLoginAttempts: failed, lockedUntil }));
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const loggedIn = await this.userRepository.update(
      user.patch({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      }),
    );

    const tokens = this.tokenService.generateTokens({
      sub: loggedIn.id,
      email: loggedIn.email,
      role: loggedIn.role,
      roles: loggedIn.roles,
    });

    return {
      ...tokens,
      user: {
        id: loggedIn.id,
        email: loggedIn.email,
        name: loggedIn.name,
        username: loggedIn.username,
        role: loggedIn.role,
        roles: loggedIn.roles,
      },
    };
  }
}
