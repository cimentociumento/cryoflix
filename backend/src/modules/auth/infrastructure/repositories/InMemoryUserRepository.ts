import {
  InMemoryDatabase,
  UserRecord,
} from '../../../../shared/infrastructure/persistence/InMemoryDatabase';
import { User, UserProps } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

export class InMemoryUserRepository implements IUserRepository {
  private readonly db = InMemoryDatabase.getInstance();

  async create(user: User): Promise<User> {
    this.db.users.set(user.id, {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      roles: user.roles,
      preferences: user.preferences,
      history: user.history,
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = Array.from(this.db.users.values()).find(
      (userRecord) => userRecord.email === email,
    );

    return record ? this.mapRecordToEntity(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = this.db.users.get(id);
    return record ? this.mapRecordToEntity(record) : null;
  }

  async update(user: User): Promise<User> {
    const record = this.db.users.get(user.id);

    if (!record) {
      throw new NotFoundError('Usuário', user.id);
    }

    this.db.users.set(user.id, {
      ...record,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      roles: user.roles,
      preferences: user.preferences,
      history: user.history,
    });

    return user;
  }

  async list(): Promise<User[]> {
    return Array.from(this.db.users.values()).map((record) => this.mapRecordToEntity(record));
  }

  private mapRecordToEntity(record: UserRecord): User {
    const props: UserProps = {
      email: record.email,
      name: record.name,
      passwordHash: record.passwordHash,
      roles: record.roles,
      preferences: record.preferences,
      history: record.history,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return User.restore(props, record.id);
  }
}

