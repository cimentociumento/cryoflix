import { httpClient } from '../../shared/api/httpClient';
import type { MovieMetadata } from '../../shared/types';

export const metadataService = {
  async search(query: string, page = 1) {
    const params = new URLSearchParams({ query, page: String(page) });
    return httpClient<MovieMetadata[]>(`/metadata/search?${params.toString()}`);
  },
  async getMovie(id: number) {
    return httpClient<MovieMetadata>(`/metadata/${id}`);
  },
  async getTrending() {
    return httpClient<MovieMetadata[]>(`/metadata/trending`);
  },
  async getRecommendations(id: number) {
    return httpClient<MovieMetadata[]>(`/metadata/${id}/recommendations`);
  },
};


