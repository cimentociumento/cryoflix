import { ISubtitleRepository, SearchSubtitleParams } from '../../domain/repositories/ISubtitleRepository';
import { Subtitle } from '../../domain/entities/Subtitle';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';

export class SearchSubtitles {
  private static CACHE_TTL = 24 * 60 * 60;

  constructor(
    private readonly repository: ISubtitleRepository,
    private readonly cache: ICacheProvider,
  ) {}

  async execute(params: SearchSubtitleParams): Promise<Subtitle[]> {
    const cacheKey = this.buildCacheKey(params);
    const cached = await this.cache.get<Subtitle[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const subtitles = await this.repository.search(params);
    const filtered = this.filterQuality(subtitles);
    const sorted = this.sortByQuality(filtered);
    await this.cache.set(cacheKey, sorted, SearchSubtitles.CACHE_TTL);
    return sorted;
  }

  private filterQuality(subtitles: Subtitle[]): Subtitle[] {
    return subtitles.filter((subtitle) => subtitle.isPtBr && subtitle.downloadCount > 10);
  }

  private sortByQuality(subtitles: Subtitle[]): Subtitle[] {
    return [...subtitles].sort((a, b) => {
      if (a.isHighQuality && !b.isHighQuality) return -1;
      if (!a.isHighQuality && b.isHighQuality) return 1;
      return b.rating - a.rating;
    });
  }

  private buildCacheKey(params: SearchSubtitleParams): string {
    return `subtitles:${params.imdbId ?? params.movieId ?? 'unknown'}:${params.language ?? 'pt-BR'}`;
  }
}


