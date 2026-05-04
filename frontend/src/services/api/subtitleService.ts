import { httpClient, resolveApiBaseUrl } from '../../shared/api/httpClient';
import type { SubtitleOption } from '../../shared/types';

type SearchParams = {
  movieId?: number;
  imdbId?: string;
};

export const subtitleService = {
  async search(params: SearchParams) {
    const query = new URLSearchParams();
    if (params.movieId) {
      query.append('movieId', String(params.movieId));
    }
    if (params.imdbId) {
      query.append('imdbId', params.imdbId);
    }
    const qs = query.toString();
    const suffix = qs ? `?${qs}` : '';
    return httpClient<SubtitleOption[]>(`/subtitles${suffix}`);
  },
  getDownloadUrl(fileId: number) {
    return `${resolveApiBaseUrl()}/subtitles/${fileId}/download`;
  },
};


