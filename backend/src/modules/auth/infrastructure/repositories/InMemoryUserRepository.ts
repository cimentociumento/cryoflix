import {
  InMemoryDatabase,
  UserRecord,
} from '../../../../shared/infrastructure/persistence/InMemoryDatabase';
import { User, type UserProps, type WatchHistoryEntry } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

function recordToUser(record: UserRecord): User {
  const props: UserProps = {
    email: record.email,
    username: record.username,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    bio: record.bio,
    passwordHash: record.passwordHash,
    role: record.role,
    status: record.status,
    emailVerified: record.emailVerified,
    emailVerifyToken: record.emailVerifyToken,
    emailVerifyExpires: record.emailVerifyExpires,
    passwordResetToken: record.passwordResetToken,
    passwordResetExpires: record.passwordResetExpires,
    failedLoginAttempts: record.failedLoginAttempts,
    lockedUntil: record.lockedUntil,
    lastLoginAt: record.lastLoginAt,
    deletedAt: record.deletedAt,
    preferences: record.preferences,
    history: record.history,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  return User.restore(props, record.id);
}

function userToRecord(user: User): UserRecord {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    emailVerifyToken: user.emailVerifyToken,
    emailVerifyExpires: user.emailVerifyExpires,
    passwordResetToken: user.passwordResetToken,
    passwordResetExpires: user.passwordResetExpires,
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: user.lockedUntil,
    lastLoginAt: user.lastLoginAt,
    deletedAt: user.deletedAt,
    preferences: user.preferences,
    history: user.history,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class InMemoryUserRepository implements IUserRepository {
  private readonly db = InMemoryDatabase.getInstance();

  async create(user: User): Promise<User> {
    this.db.users.set(user.id, userToRecord(user));
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = Array.from(this.db.users.values()).find(
      (userRecord) => userRecord.email === email && !userRecord.deletedAt,
    );
    return record ? recordToUser(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = this.db.users.get(id);
    if (!record || record.deletedAt) {
      return null;
    }
    return recordToUser(record);
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = Array.from(this.db.users.values()).find(
      (u) => u.username === username && !u.deletedAt,
    );
    return record ? recordToUser(record) : null;
  }

  async findByEmailVerifyToken(token: string): Promise<User | null> {
    const record = Array.from(this.db.users.values()).find(
      (u) => u.emailVerifyToken === token && !u.deletedAt,
    );
    return record ? recordToUser(record) : null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const record = Array.from(this.db.users.values()).find(
      (u) => u.passwordResetToken === token && !u.deletedAt,
    );
    return record ? recordToUser(record) : null;
  }

  async update(user: User): Promise<User> {
    const record = this.db.users.get(user.id);
    if (!record) {
      throw new NotFoundError('Usuário', user.id);
    }
    this.db.users.set(user.id, userToRecord(user));
    return user;
  }

  async delete(id: string): Promise<void> {
    const record = this.db.users.get(id);
    if (!record) {
      throw new NotFoundError('Usuário', id);
    }
    this.db.users.set(id, { ...record, deletedAt: new Date() });
    for (const [key, progress] of this.db.watchProgress.entries()) {
      if (progress.userId === id) {
        this.db.watchProgress.delete(key);
      }
    }
    for (const [key, subscription] of this.db.subscriptions.entries()) {
      if (subscription.userId === id) {
        this.db.subscriptions.delete(key);
      }
    }
  }

  async list(): Promise<User[]> {
    return Array.from(this.db.users.values())
      .filter((r) => !r.deletedAt)
      .map((record) => recordToUser(record));
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
}
