import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import type {
  IRefreshTokenRepository,
  RefreshTokenMeta,
} from '../../domain/repositories/IRefreshTokenRepository';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: string, userId: string, expiresAt: Date, meta?: RefreshTokenMeta): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: randomUUID(),
        token,
        userId,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });
  }

  async findByToken(
    token: string,
  ): Promise<{ id: string; userId: string; revokedAt: Date | null } | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { token },
      select: { id: true, userId: true, revokedAt: true },
    });
    return row;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
