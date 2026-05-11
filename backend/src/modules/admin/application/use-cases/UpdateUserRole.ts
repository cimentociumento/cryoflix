import type { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class UpdateUserRoleUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(actorId: string, targetUserId: string, role: Role) {
    const existing = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Usuário', targetUserId);
    }

    if (actorId === targetUserId && existing.role === Role.ADMIN && role === Role.USER) {
      throw new ValidationError('Não é permitido remover o próprio papel de administrador.');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
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
