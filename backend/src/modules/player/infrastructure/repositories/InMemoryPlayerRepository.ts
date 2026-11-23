import { IPlayerRepository, PlayerProgress } from '../../domain/repositories/IPlayerRepository';
import { SuperEmbedAdapter } from '../adapters/SuperEmbedAdapter';
import { VideoQuality, VideoSource } from '../../domain/entities/VideoSource';
import { InMemoryDatabase } from '../../../../shared/infrastructure/persistence/InMemoryDatabase';

export class InMemoryPlayerRepository implements IPlayerRepository {
  private readonly db = InMemoryDatabase.getInstance();

  constructor(private readonly adapter: SuperEmbedAdapter) {}

  async getEmbedSource(movieId: number, imdbId?: string): Promise<VideoSource> {
    const embedUrl = await this.adapter.getEmbedUrl(movieId, imdbId);
    return new VideoSource(movieId, embedUrl, VideoQuality.FULL_HD, true);
  }

  async saveProgress(progress: PlayerProgress): Promise<void> {
    const key = `${progress.userId}:${progress.movieId}`;
    const existing = this.db.watchProgress.get(key);
    if (existing && existing.updatedAt > progress.updatedAt) return;
    this.db.watchProgress.set(key, {
      userId: progress.userId,
      movieId: progress.movieId,
      progress: progress.progress,
      timestamp: progress.timestamp,
      updatedAt: progress.updatedAt,
    });

    const user = this.db.users.get(progress.userId);
    if (user) {
      const videoId = String(progress.movieId);
      const nextHistory = user.history.filter((item) => item.videoId !== videoId);
      if (progress.progress > 0 || progress.timestamp > 0) {
        nextHistory.unshift({ videoId, watchedAt: progress.updatedAt, progress: progress.progress, timestamp: progress.timestamp });
      }
      this.db.users.set(progress.userId, { ...user, history: nextHistory.slice(0, 50) });
    }
  }

  async getProgress(userId: string, movieId: number): Promise<PlayerProgress | null> {
    const key = `${userId}:${movieId}`;
    const record = this.db.watchProgress.get(key);
    if (!record) {
      return null;
    }
    return {
      userId: record.userId,
      movieId: record.movieId,
      progress: record.progress,
      timestamp: record.timestamp,
      updatedAt: record.updatedAt,
    };
  }
}
