import type { PrismaClient } from '@prisma/client';
import { Movie } from '../../domain/entities/Movie';

export class BlockedMoviesFilter {
  constructor(private readonly prisma: PrismaClient | null) {}

  async filter(movies: Movie[]): Promise<Movie[]> {
    if (!this.prisma || movies.length === 0) {
      return movies;
    }
    const blocked = await this.prisma.blockedMovie.findMany({
      where: { tmdbId: { in: movies.map((movie) => movie.tmdbId) } },
      select: { tmdbId: true },
    });
    if (blocked.length === 0) {
      return movies;
    }
    const blockedIds = new Set(blocked.map((entry: { tmdbId: number }) => entry.tmdbId));
    return movies.filter((movie) => !blockedIds.has(movie.tmdbId));
  }

  async isBlocked(tmdbId: number): Promise<boolean> {
    if (!this.prisma) {
      return false;
    }
    const found = await this.prisma.blockedMovie.findUnique({ where: { tmdbId } });
    return Boolean(found);
  }
}
