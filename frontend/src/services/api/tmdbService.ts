const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

const getTmdbApiKey = () => import.meta.env.VITE_TMDB_API_KEY as string | undefined;

type TmdbReleaseDatesResponse = {
  id: number;
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{
      certification: string;
      iso_639_1: string | null;
      release_date: string;
      type: number;
      note?: string;
    }>;
  }>;
};

export type BrazilianDubInfo = {
  hasBrazilianDub: boolean;
};

async function fetchFromTmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getTmdbApiKey();

  if (!apiKey) {
    throw new Error('TMDB API key (VITE_TMDB_API_KEY) não configurada');
  }

  const searchParams = new URLSearchParams({ api_key: apiKey, ...params });
  const url = `${TMDB_API_BASE_URL}${path}?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const tmdbService = {
  /**
   * Verifica, via TMDB, se o filme possui lançamento oficial com dublagem BR.
   * Baseado em /movie/{id}/release_dates e filtrando país BR + idioma pt + type 3 ou 6.
   */
  async getBrazilianDubInfoByMovieId(movieId: number): Promise<BrazilianDubInfo> {
    const data = await fetchFromTmdb<TmdbReleaseDatesResponse>(`/movie/${movieId}/release_dates`);

    const brazilEntry = data.results.find((r) => r.iso_3166_1 === 'BR');

    if (!brazilEntry) {
      return { hasBrazilianDub: false };
    }

    const hasDub = brazilEntry.release_dates.some(
      (release) =>
        release.iso_639_1 === 'pt' &&
        (release.type === 3 || release.type === 6),
    );

    return { hasBrazilianDub: hasDub };
  },
};

