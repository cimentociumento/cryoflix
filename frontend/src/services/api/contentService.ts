import { httpClient } from '../../shared/api/httpClient';
import type { Video } from '../../shared/types';

export const contentService = {
  async list(query?: string) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return httpClient<Video[]>(`/content${params}`);
  },
  async findById(id: string) {
    return httpClient<Video>(`/content/${id}`);
  },
  async publish(id: string) {
    return httpClient<Video>(`/content/${id}/publish`, { method: 'POST' });
  },
};

