import type { WatchHistoryEntry } from '../entities/User';
import { User } from '../entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailVerifyToken(token: string): Promise<User | null>;
  findByPasswordResetToken(token: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  list(): Promise<User[]>;
  appendWatchHistory(userId: string, entry: WatchHistoryEntry): Promise<void>;
}
