import { HttpClient } from '../../../../shared/infrastructure/http/HttpClient';
import { env } from '../../../../config/environment';

type SearchParams = {
  movieId?: number;
  imdbId?: string;
  language?: string;
};

type SubtitleDTO = {
  id: string;
  language: string;
  downloadCount: number;
  rating: number;
  fileId: number;
};

const MOCK_SUBTITLES: SubtitleDTO[] = [
  {
    id: 'mock-ptbr',
    language: 'pt-BR',
    downloadCount: 150,
    rating: 9,
    fileId: 1,
  },
];

export class OpenSubtitlesAdapter {
  private readonly http = env.openSubtitles.apiKey
    ? HttpClient.create({
        baseURL: 'https://api.opensubtitles.com/api/v1',
        headers: {
          'Api-Key': env.openSubtitles.apiKey,
          'User-Agent': env.openSubtitles.userAgent,
        },
      })
    : null;

  async searchSubtitles(params: SearchParams): Promise<SubtitleDTO[]> {
    if (!this.http) {
      return MOCK_SUBTITLES;
    }

    const response = await this.http.get<{ data: any[] }>('/subtitles', {
      params: this.buildSearchParams(params),
    });

    return response.data.map((item) => ({
      id: String(item.id),
      language: item.attributes.language,
      downloadCount: item.attributes.download_count,
      rating: item.attributes.ratings,
      fileId: item.attributes.files[0].file_id,
    }));
  }

  async downloadSubtitle(fileId: number): Promise<string> {
    if (!this.http) {
      return 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nLegenda demo FFlix\n';
    }

    const response = await this.http.post<{ link: string }>('/download', { file_id: fileId });
    const link = response.link;
    return this.http.get<string>(link, { responseType: 'text' as never });
  }

  private buildSearchParams(params: SearchParams): Record<string, unknown> {
    return {
      imdb_id: params.imdbId,
      tmdb_id: params.movieId,
      languages: params.language ?? 'pt-BR',
    };
  }
}


