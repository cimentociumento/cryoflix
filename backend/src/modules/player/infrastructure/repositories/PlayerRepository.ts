import type { PrismaClient } from '@prisma/client';
import type { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { IPlayerRepository, PlayerProgress } from '../../domain/repositories/IPlayerRepository';
import { SuperEmbedAdapter } from '../adapters/SuperEmbedAdapter';
import { VideoQuality, VideoSource } from '../../domain/entities/VideoSource';
import { randomUUID } from 'crypto';

export class PlayerRepository implements IPlayerRepository {
  constructor(
    private readonly adapter: SuperEmbedAdapter,
    private readonly prisma: PrismaClient,
    private readonly userRepository: IUserRepository,
  ) {}

  async getEmbedSource(movieId: number, imdbId?: string): Promise<VideoSource> {
    const embedUrl = await this.adapter.getEmbedUrl(movieId, imdbId);
    return new VideoSource(movieId, embedUrl, VideoQuality.FULL_HD, true);
  }

  async saveProgress(progress: PlayerProgress): Promise<void> {
    const movieIdStr = String(progress.movieId);
    const progressPct = Math.min(100, Math.max(0, progress.progress * 100));

    await this.prisma.watchProgress.upsert({
      where: {
        userId_movieId: {
          userId: progress.userId,
          movieId: movieIdStr,
        },
      },
      create: {
        id: randomUUID(),
        userId: progress.userId,
        movieId: movieIdStr,
        progress: progressPct,
        timestamp: 0,
      },
      update: {
        progress: progressPct,
      },
    });

    if (progress.progress >= 1) {
      await this.userRepository.appendWatchHistory(progress.userId, {
        videoId: movieIdStr,
        watchedAt: new Date(),
        progress: 1,
      });
    }
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
      updatedAt: row.updatedAt,
    };
  }
}
