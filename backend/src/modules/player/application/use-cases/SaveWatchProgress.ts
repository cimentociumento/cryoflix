import { ValidationError } from '../../../../shared/domain/errors/ValidationError';
import { IPlayerRepository } from '../../domain/repositories/IPlayerRepository';

type Params = {
  movieId: number;
  userId: string;
  progress: number;
};

export class SaveWatchProgress {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute({ movieId, userId, progress }: Params): Promise<void> {
    if (!Number.isFinite(movieId) || movieId <= 0) {
      throw new ValidationError('Filme inválido');
    }

    if (!userId) {
      throw new ValidationError('Usuário inválido');
    }

    if (progress < 0 || progress > 1) {
      throw new ValidationError('Progresso deve estar entre 0 e 1');
    }

    await this.repository.saveProgress({
      movieId,
      userId,
      progress,
      updatedAt: new Date(),
    });
  }
}


