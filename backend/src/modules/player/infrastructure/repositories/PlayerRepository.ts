import type { PrismaClient } from '@prisma/client';
import { IPlayerRepository, PlayerProgress } from '../../domain/repositories/IPlayerRepository';
import { SuperEmbedAdapter } from '../adapters/SuperEmbedAdapter';
import { VideoQuality, VideoSource } from '../../domain/entities/VideoSource';
import { randomUUID } from 'crypto';

export class PlayerRepository implements IPlayerRepository {
  constructor(
    private readonly adapter: SuperEmbedAdapter,
    private readonly prisma: PrismaClient,
  ) {}

  async getEmbedSource(movieId: number, imdbId?: string): Promise<VideoSource> {
    const embedUrl = await this.adapter.getEmbedUrl(movieId, imdbId);
    return new VideoSource(movieId, embedUrl, VideoQuality.FULL_HD, true);
  }

  async saveProgress(progress: PlayerProgress): Promise<void> {
    const movieIdStr = String(progress.movieId);
    const progressPct = Math.min(100, Math.max(0, progress.progress * 100));

    // Eventos podem chegar fora de ordem quando a página fecha. O horário
    // capturado no evento impede um POST antigo de sobrescrever o ponto novo.
    await this.prisma.$transaction([
      this.prisma.watchProgress.createMany({
        data: {
          id: randomUUID(),
          userId: progress.userId,
          movieId: movieIdStr,
          progress: progressPct,
          timestamp: progress.timestamp,
          updatedAt: progress.updatedAt,
        },
        skipDuplicates: true,
      }),
      this.prisma.watchProgress.updateMany({
        where: {
          userId: progress.userId,
          movieId: movieIdStr,
          updatedAt: { lte: progress.updatedAt },
        },
        data: { progress: progressPct, timestamp: progress.timestamp, updatedAt: progress.updatedAt },
      }),
    ]);

  }

  async getProgress(userId: string, movieId: number): Promise<PlayerProgress | null> {
    const row = await this.prisma.watchProgress.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: String(movieId),
        },
      },
    });
    if (!row) {
      return null;
    }
    return {
      userId: row.userId,
      movieId: Number(row.movieId),
      progress: row.progress / 100,
      timestamp: row.timestamp,
      updatedAt: row.updatedAt,
    };
  }
}
