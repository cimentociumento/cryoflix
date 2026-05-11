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
    this.db.watchProgress.set(key, {
      userId: progress.userId,
      movieId: progress.movieId,
      progress: progress.progress,
      updatedAt: new Date(),
    });

    if (progress.progress >= 1) {
      const user = this.db.users.get(progress.userId);
      if (user) {
        const videoId = String(progress.movieId);
        const existingIndex = user.history.findIndex((item) => item.videoId === videoId);
        const entry = { videoId, watchedAt: new Date(), progress: 1 };

        if (existingIndex >= 0) {
          user.history.splice(existingIndex, 1);
        }

        user.history.unshift(entry);
        const nextHistory = user.history.slice(0, 50);
        this.db.users.set(progress.userId, { ...user, history: nextHistory });
      }
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
      updatedAt: record.updatedAt,
    };
  }
}
