import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

export class GetUserByIdUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundError('Usuário', id);
    }
    return user;
  }
}
