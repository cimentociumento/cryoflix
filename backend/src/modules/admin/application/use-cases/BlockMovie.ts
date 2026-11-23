import type { PrismaClient } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/errors/ConflictError';

type Params = {
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  reason?: string;
  blockedById: string;
};

export class BlockMovieUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute({ tmdbId, title, posterPath, reason, blockedById }: Params) {
    const existing = await this.prisma.blockedMovie.findUnique({ where: { tmdbId } });
    if (existing) {
      throw new ConflictError('Este filme já está bloqueado.');
    }

    return this.prisma.blockedMovie.create({
      data: {
        tmdbId,
        title,
        posterPath: posterPath ?? null,
        reason: reason ?? null,
        blockedById,
      },
    });
  }
}
