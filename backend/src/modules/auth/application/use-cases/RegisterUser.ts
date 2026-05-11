import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Email } from '../../domain/value-objects/Email';
import { User } from '../../domain/entities/User';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { ConflictError } from '../../../../shared/domain/errors/ConflictError';
import { EmailService } from '../../../../shared/services/EmailService';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService,
  ) {}

  private async allocateUsername(email: string): Promise<string> {
    const local =
      email
        .split('@')[0]
        ?.replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 24) || 'user';
    let candidate = local;
    for (let i = 0; i < 60; i += 1) {
      const exists = await this.userRepository.findByUsername(candidate);
      if (!exists) {
        return candidate;
      }
      candidate = `${local}_${randomBytes(3).toString('hex')}`;
    }
    throw new ConflictError('Não foi possível gerar username único');
  }

  async execute(dto: CreateUserDTO): Promise<User> {
    const email = Email.create(dto.email).value;
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new ConflictError('Usuário já existe');
    }

    const username = await this.allocateUsername(email);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verifyToken = randomUUID();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = User.create({
      email,
      username,
      displayName: dto.name,
      avatarUrl: null,
      bio: null,
      passwordHash,
      role: 'USER',
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      deletedAt: null,
      preferences: {},
      history: [],
    });

    const created = await this.userRepository.create(user);

    if (process.env.NODE_ENV !== 'test') {
      await this.emailService.sendVerificationEmail(created.email, verifyToken);
    }

    return created;
  }
}
