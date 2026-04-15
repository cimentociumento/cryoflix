import { randomUUID } from 'crypto';
import { Entity } from '../../../../shared/domain/Entity';

export type UserProps = {
  email: string;
  passwordHash: string;
  name: string;
  roles: string[];
  preferences: Record<string, unknown>;
  history: Array<{ videoId: string; watchedAt: Date; progress: number }>;
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

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get roles(): string[] {
    return this.props.roles;
  }

  get preferences(): Record<string, unknown> {
    return this.props.preferences;
  }

  get history(): Array<{ videoId: string; watchedAt: Date; progress: number }> {
    return this.props.history;
  }

  toSafeJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      roles: this.roles,
      preferences: this.preferences,
      history: this.history,
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

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({ ...props, createdAt: now, updatedAt: now }, randomUUID());
  }

  static restore(props: UserProps, id: string): User {
    return new User(props, id);
  }
}

