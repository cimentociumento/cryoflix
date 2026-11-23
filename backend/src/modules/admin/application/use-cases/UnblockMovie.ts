import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

export class UnblockMovieUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(tmdbId: number) {
    const existing = await this.prisma.blockedMovie.findUnique({ where: { tmdbId } });
    if (!existing) {
      throw new NotFoundError('Filme bloqueado', tmdbId);
    }

    await this.prisma.blockedMovie.delete({ where: { tmdbId } });
  }
}
