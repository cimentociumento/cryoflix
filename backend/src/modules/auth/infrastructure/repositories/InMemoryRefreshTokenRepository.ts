import { randomUUID } from 'crypto';
import type {
  IRefreshTokenRepository,
  RefreshTokenMeta,
} from '../../domain/repositories/IRefreshTokenRepository';

type Row = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent?: string;
  ipAddress?: string;
};

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly byToken = new Map<string, Row>();

  async save(token: string, userId: string, expiresAt: Date, meta?: RefreshTokenMeta): Promise<void> {
    this.byToken.set(token, {
      id: randomUUID(),
      token,
      userId,
      expiresAt,
      revokedAt: null,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });
  }

  async findByToken(
    token: string,
  ): Promise<{ id: string; userId: string; revokedAt: Date | null } | null> {
    const row = this.byToken.get(token);
    if (!row) {
      return null;
    }
    return { id: row.id, userId: row.userId, revokedAt: row.revokedAt };
  }

  async revoke(token: string): Promise<void> {
    const row = this.byToken.get(token);
    if (row) {
      row.revokedAt = new Date();
    }
  }

  async revokeAllByUser(userId: string): Promise<void> {
    for (const row of this.byToken.values()) {
      if (row.userId === userId && !row.revokedAt) {
        row.revokedAt = new Date();
      }
    }
  }
}
