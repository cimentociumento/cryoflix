import { randomUUID } from 'crypto';
import { Entity } from '../../../../shared/domain/Entity';
import type { DomainAccountStatus, DomainRole } from '../types/AccountTypes';

export type WatchHistoryEntry = { videoId: string; watchedAt: Date; progress: number };

export type UserProps = {
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  passwordHash: string;
  role: DomainRole;
  status: DomainAccountStatus;
  emailVerified: boolean;
  emailVerifyToken: string | null;
  emailVerifyExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
  preferences: Record<string, unknown>;
  history: WatchHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
};

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id: string) {
    super(props, id);
  }

  get email(): string {
    return this.props.email;
  }

  get username(): string {
    return this.props.username;
  }

  /** Nome exibido na API legada — displayName ou username */
  get name(): string {
    return this.props.displayName ?? this.props.username;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): DomainRole {
    return this.props.role;
  }

  get roles(): string[] {
    return this.props.role === 'ADMIN' ? ['admin', 'viewer'] : ['viewer'];
  }

  get status(): DomainAccountStatus {
    return this.props.status;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get emailVerifyToken(): string | null {
    return this.props.emailVerifyToken;
  }

  get emailVerifyExpires(): Date | null {
    return this.props.emailVerifyExpires;
  }

  get passwordResetToken(): string | null {
    return this.props.passwordResetToken;
  }

  get passwordResetExpires(): Date | null {
    return this.props.passwordResetExpires;
  }

  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get preferences(): Record<string, unknown> {
    return this.props.preferences;
  }

  get history(): WatchHistoryEntry[] {
    return this.props.history;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toSafeJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      name: this.name,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      role: this.role,
      roles: this.roles,
      status: this.status,
      emailVerified: this.emailVerified,
      preferences: this.preferences,
      history: this.history.map((h) => ({
        videoId: h.videoId,
        watchedAt: h.watchedAt.toISOString(),
        progress: h.progress,
      })),
      lastLoginAt: this.lastLoginAt?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
    };
  }

  withPreferences(preferences: Record<string, unknown>): User {
    return User.restore(
      {
        ...this.props,
        preferences,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withProfile(partial: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null }): User {
    return User.restore(
      {
        ...this.props,
        displayName: partial.displayName !== undefined ? partial.displayName : this.props.displayName,
        bio: partial.bio !== undefined ? partial.bio : this.props.bio,
        avatarUrl: partial.avatarUrl !== undefined ? partial.avatarUrl : this.props.avatarUrl,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withHistory(history: WatchHistoryEntry[]): User {
    return User.restore(
      {
        ...this.props,
        history,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  patch(partial: Partial<UserProps>): User {
    return User.restore(
      {
        ...this.props,
        ...partial,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({ ...props, createdAt: now, updatedAt: now }, randomUUID());
  }

  static restore(props: UserProps, id: string): User {
    return new User(props, id);
  }
}
