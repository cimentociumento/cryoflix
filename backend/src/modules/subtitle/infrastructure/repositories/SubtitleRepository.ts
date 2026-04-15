import { ISubtitleRepository, SearchSubtitleParams } from '../../domain/repositories/ISubtitleRepository';
import { Subtitle, SubtitleFormat } from '../../domain/entities/Subtitle';
import { OpenSubtitlesAdapter } from '../adapters/OpenSubtitlesAdapter';

export class SubtitleRepository implements ISubtitleRepository {
  constructor(private readonly adapter: OpenSubtitlesAdapter) {}

  async search(params: SearchSubtitleParams): Promise<Subtitle[]> {
    const results = await this.adapter.searchSubtitles(params);
    return results.map(
      (subtitle) =>
        new Subtitle(
          subtitle.id,
          params.movieId ?? 0,
          subtitle.language,
          SubtitleFormat.SRT,
          subtitle.downloadCount,
          subtitle.rating,
          subtitle.fileId,
        ),
    );
  }

  async download(fileId: number): Promise<string> {
    return this.adapter.downloadSubtitle(fileId);
  }
}


