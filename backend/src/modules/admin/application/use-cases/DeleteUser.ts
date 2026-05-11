import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class DeleteUserUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new ValidationError('Não é possível remover a própria conta por este endpoint.');
    }

    const existing = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Usuário', targetUserId);
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date() },
    });
  }
}
