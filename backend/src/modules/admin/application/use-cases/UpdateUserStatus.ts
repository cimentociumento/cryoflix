import type { PrismaClient, AccountStatus } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

export class UpdateUserStatusUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(targetUserId: string, status: AccountStatus) {
    const existing = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Usuário', targetUserId);
    }

    if (status === 'SUSPENDED' || status === 'BANNED') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }
}
