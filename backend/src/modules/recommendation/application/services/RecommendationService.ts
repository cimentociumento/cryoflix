import { InMemoryDatabase } from '../../../../shared/infrastructure/persistence/InMemoryDatabase';

export class RecommendationService {
  private readonly db = InMemoryDatabase.getInstance();

  getRecommendations(userId: string) {
    const watchedCategories = new Set(
      Array.from(this.db.videos.values())
        .filter((video) => video.status === 'published')
        .flatMap((video) => video.categories),
    );

    return Array.from(this.db.videos.values()).filter((video) =>
      video.categories.some((category) => watchedCategories.has(category)),
    );
  }

  submitFeedback(userId: string, videoId: string, score: number) {
    return { userId, videoId, score, receivedAt: new Date().toISOString() };
  }
}

