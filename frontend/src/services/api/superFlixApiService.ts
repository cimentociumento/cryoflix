function isValidImdbId(id: string): boolean {
  return /^tt\d{7,8}$/.test(id);
}

/**
 * Domínio da SuperFlix API. O serviço troca de domínio com frequência; os domínios
 * "de entrada" (ex.: superflixapi.help) redirecionam para o atual. Pode ser
 * sobrescrito por VITE_SUPERFLIX_BASE_URL sem novo código.
 */
const DEFAULT_BASE_URL = 'https://superflixapi.help';

const getBaseUrl = (): string => {
  const fromEnv = (import.meta.env.VITE_SUPERFLIX_BASE_URL as string | undefined)?.trim();
  const candidate = fromEnv || DEFAULT_BASE_URL;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.origin : DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
};

const normalizeImdbId = (imdbId: string): string | null => {
  const normalized = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
  return isValidImdbId(normalized) ? normalized : null;
};

class SuperFlixApiService {
  /**
   * URL do player de filme: https://<domínio>/filme/{imdbId}
   * Retorna null se o IMDb ID não bater com o formato esperado.
   */
  getMoviePlayerUrl(imdbId: string): string | null {
    const id = normalizeImdbId(imdbId);
    return id ? `${getBaseUrl()}/filme/${encodeURIComponent(id)}` : null;
  }

  /**
   * URL do player de série: https://<domínio>/serie/{imdbId}[/{temporada}/{episódio}]
   * Sem temporada/episódio, o próprio player mostra a seleção.
   */
  getSeriesPlayerUrl(imdbId: string, season?: number, episode?: number): string | null {
    const id = normalizeImdbId(imdbId);
    if (!id) return null;
    const base = `${getBaseUrl()}/serie/${encodeURIComponent(id)}`;
    const validPart = (n?: number) => Number.isInteger(n) && (n as number) > 0;
    return validPart(season) && validPart(episode) ? `${base}/${season}/${episode}` : base;
  }
}

export const superFlixApiService = new SuperFlixApiService();
