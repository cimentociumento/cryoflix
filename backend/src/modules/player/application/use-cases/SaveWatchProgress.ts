import { ValidationError } from '../../../../shared/domain/errors/ValidationError';
import { IPlayerRepository } from '../../domain/repositories/IPlayerRepository';

type Params = {
  movieId: number;
  userId: string;
  progress: number;
  timestamp?: number;
  recordedAt?: string;
};

export class SaveWatchProgress {
  constructor(private readonly repository: IPlayerRepository) {}

  async execute({ movieId, userId, progress, timestamp = 0, recordedAt }: Params): Promise<void> {
    if (!Number.isInteger(movieId) || movieId <= 0) {
      throw new ValidationError('Filme inválido');
    }

    if (!userId) {
      throw new ValidationError('Usuário inválido');
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
      throw new ValidationError('Progresso deve estar entre 0 e 1');
    }

    if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > 2_147_483_647) {
      throw new ValidationError('Posição de reprodução inválida');
    }

    const now = Date.now();
    const recordedTime = recordedAt ? new Date(recordedAt).getTime() : now;
    if (!Number.isFinite(recordedTime) || recordedTime > now + 30_000) {
      throw new ValidationError('Horário do ponto de reprodução inválido');
    }
    const updatedAt = new Date(Math.min(recordedTime, now));

    await this.repository.saveProgress({
      movieId,
      userId,
      progress,
      timestamp,
      updatedAt,
    });
  }
}


