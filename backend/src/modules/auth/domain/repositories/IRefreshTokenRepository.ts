export type RefreshTokenMeta = {
  userAgent?: string;
  ipAddress?: string;
};

export interface IRefreshTokenRepository {
  save(token: string, userId: string, expiresAt: Date, meta?: RefreshTokenMeta): Promise<void>;
  findByToken(token: string): Promise<{ id: string; userId: string; revokedAt: Date | null } | null>;
  revoke(token: string): Promise<void>;
  revokeAllByUser(userId: string): Promise<void>;
}
