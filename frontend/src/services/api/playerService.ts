import { httpClient } from '../../shared/api/httpClient';
import type { EmbedSource, WatchProgress } from '../../shared/types';

type ProgressPayload = {
  movieId: number;
  progress: number;
};

export const playerService = {
  async getEmbed(movieId: number, imdbId?: string) {
    const query = imdbId ? `?imdbId=${encodeURIComponent(imdbId)}` : '';
    return httpClient<EmbedSource>(`/player/${movieId}/embed${query}`);
  },
  async saveProgress(payload: ProgressPayload) {
    return httpClient<{ message: string }>('/player/progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async getProgress(movieId: number) {
    return httpClient<WatchProgress>(`/player/${movieId}/progress`);
  },
};


