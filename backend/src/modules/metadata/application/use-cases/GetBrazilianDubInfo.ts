import { TMDbClient } from '../../infrastructure/http/TMDbClient';
import { ICacheProvider } from '../../../../shared/infrastructure/cache';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

type Params = {
  id: number;
};

export type BrazilianDubInfo = {
  hasBrazilianDub: boolean;
};

export class GetBrazilianDubInfo {
  private static CACHE_TTL = 24 * 60 * 60; // 24 horas — dado de lançamento não muda

  constructor(
    private readonly tmdbClient: TMDbClient,
    private readonly cache: ICacheProvider,
  ) {}

  async execute({ id }: Params): Promise<BrazilianDubInfo> {
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError('ID de filme inválido');
    }

    const cacheKey = `metadata:br-dub:${id}`;
    const cached = await this.cache.get<BrazilianDubInfo>(cacheKey);
    if (cached) {
      return cached;
    }

    const releaseDates = await this.tmdbClient.getReleaseDates(id);
    const brazilEntry = releaseDates?.results.find((r) => r.iso_3166_1 === 'BR');

    const result: BrazilianDubInfo = {
      hasBrazilianDub: brazilEntry
        ? brazilEntry.release_dates.some(
            (release) => release.iso_639_1 === 'pt' && (release.type === 3 || release.type === 6),
          )
        : false,
    };

    await this.cache.set(cacheKey, result, GetBrazilianDubInfo.CACHE_TTL);
    return result;
  }
}
