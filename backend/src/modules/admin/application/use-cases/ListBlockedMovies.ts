import type { PrismaClient } from '@prisma/client';

export class ListBlockedMoviesUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute() {
    return this.prisma.blockedMovie.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        blockedBy: { select: { id: true, username: true, email: true } },
      },
    });
  }
}
