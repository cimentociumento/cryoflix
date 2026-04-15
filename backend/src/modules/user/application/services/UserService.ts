import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }
    return user.toSafeJSON();
  }

  async updatePreferences(userId: string, preferences: Record<string, unknown>) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }

    const updated = await this.userRepository.update(user.withPreferences(preferences));

    return updated.toSafeJSON();
  }

  async getHistory(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário', userId);
    }

    return user.history;
  }
}

