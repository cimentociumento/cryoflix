import type { PrismaClient, User as PrismaUserRow } from '@prisma/client';
import { AccountStatus, Role } from '@prisma/client';
import { User, type UserProps, type WatchHistoryEntry } from '../../domain/entities/User';
import type { DomainAccountStatus, DomainRole } from '../../domain/types/AccountTypes';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

const CF_HISTORY_KEY = '__cf';

type CfPayload = {
  history?: Array<{ videoId: string; watchedAt: string; progress: number }>;
};

function splitPreferences(raw: unknown): { preferences: Record<string, unknown>; history: WatchHistoryEntry[] } {
  const obj = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  const cf = (obj[CF_HISTORY_KEY] && typeof obj[CF_HISTORY_KEY] === 'object'
    ? (obj[CF_HISTORY_KEY] as CfPayload)
    : {}) as CfPayload;
  const preferences = { ...obj };
  delete preferences[CF_HISTORY_KEY];
  const history =
    cf.history?.map((h) => ({
      videoId: h.videoId,
      watchedAt: new Date(h.watchedAt),
      progress: h.progress,
    })) ?? [];
  return { preferences, history };
}

function mergePreferencesForDb(
  preferences: Record<string, unknown>,
  history: WatchHistoryEntry[],
): Record<string, unknown> {
  return {
    ...preferences,
    [CF_HISTORY_KEY]: {
      history: history.map((h) => ({
        videoId: h.videoId,
        watchedAt: h.watchedAt.toISOString(),
        progress: h.progress,
      })),
    },
  };
}

function mapRole(r: Role): DomainRole {
  return r === Role.ADMIN ? 'ADMIN' : 'USER';
}

function mapStatus(s: AccountStatus): DomainAccountStatus {
  switch (s) {
    case AccountStatus.PENDING_VERIFICATION:
      return 'PENDING_VERIFICATION';
    case AccountStatus.SUSPENDED:
      return 'SUSPENDED';
    case AccountStatus.BANNED:
      return 'BANNED';
    default:
      return 'ACTIVE';
  }
}

function toPrismaRole(r: DomainRole): Role {
  return r === 'ADMIN' ? Role.ADMIN : Role.USER;
}

function toPrismaStatus(s: DomainAccountStatus): AccountStatus {
  switch (s) {
    case 'PENDING_VERIFICATION':
      return AccountStatus.PENDING_VERIFICATION;
    case 'SUSPENDED':
      return AccountStatus.SUSPENDED;
    case 'BANNED':
      return AccountStatus.BANNED;
    default:
      return AccountStatus.ACTIVE;
  }
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(user: User): Promise<User> {
    const { preferences, history } = splitPreferences(user.preferences);
    const merged = mergePreferencesForDb(preferences, history.length ? history : user.history);

    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: user.passwordHash,
        role: toPrismaRole(user.role),
        status: toPrismaStatus(user.status),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        preferences: merged as object,
        emailVerified: user.emailVerified,
        emailVerifyToken: user.emailVerifyToken,
        emailVerifyExpires: user.emailVerifyExpires,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        lastLoginAt: user.lastLoginAt,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return this.mapRowToUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return row ? this.mapRowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.mapRowToUser(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
    return row ? this.mapRowToUser(row) : null;
  }

  async findByEmailVerifyToken(token: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token, deletedAt: null },
    });
    return row ? this.mapRowToUser(row) : null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { passwordResetToken: token, deletedAt: null },
    });
    return row ? this.mapRowToUser(row) : null;
  }

  async update(user: User): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!existing) {
      throw new NotFoundError('Usuário', user.id);
    }

    const { preferences, history } = splitPreferences(user.preferences);
    const merged = mergePreferencesForDb(preferences, user.history.length ? user.history : history);

    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        username: user.username,
        passwordHash: user.passwordHash,
        role: toPrismaRole(user.role),
        status: toPrismaStatus(user.status),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        preferences: merged as object,
        emailVerified: user.emailVerified,
        emailVerifyToken: user.emailVerifyToken,
        emailVerifyExpires: user.emailVerifyExpires,
        passwordResetToken: user.passwordResetToken,
        passwordResetExpires: user.passwordResetExpires,
        lastLoginAt: user.lastLoginAt,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        deletedAt: user.deletedAt,
        updatedAt: new Date(),
      },
    });

    return this.mapRowToUser(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Usuário', id);
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.watchProgress.deleteMany({ where: { userId: id } });
  }

  async list(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
    return rows.map((r) => this.mapRowToUser(r));
  }

  async appendWatchHistory(userId: string, entry: WatchHistoryEntry): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      return;
    }
    const videoId = entry.videoId;
    const filtered = user.history.filter((h) => h.videoId !== videoId);
    const next = [entry, ...filtered].slice(0, 50);
    await this.update(user.withHistory(next));
  }

  private mapRowToUser(row: PrismaUserRow): User {
    const { preferences, history } = splitPreferences(row.preferences);

    const props: UserProps = {
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      passwordHash: row.passwordHash,
      role: mapRole(row.role),
      status: mapStatus(row.status),
      emailVerified: row.emailVerified,
      emailVerifyToken: row.emailVerifyToken,
      emailVerifyExpires: row.emailVerifyExpires,
      passwordResetToken: row.passwordResetToken,
      passwordResetExpires: row.passwordResetExpires,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      lastLoginAt: row.lastLoginAt,
      deletedAt: row.deletedAt,
      preferences,
      history: history.length ? history : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return User.restore(props, row.id);
  }
}
