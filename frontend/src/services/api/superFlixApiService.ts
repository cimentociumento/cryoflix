function isValidImdbId(id: string): boolean {
  return /^tt\d{7,8}$/.test(id);
}

class SuperFlixApiService {
  /**
   * Gera URL do iframe oficial do SuperFlixHD (superflixhd.epizy.com)
   * utilizando os parâmetros padronizados:
   *  - type: "movies" | "tvshows"
   *  - imdb: IMDb ID (com ou sem prefixo "tt")
   *
   * Exemplo final:
   * https://superflixhd.epizy.com/embed-2/?type=movies&imdb=tt1386697
   *
   * Retorna null se o IMDb ID não bater com o formato esperado.
   */
  getMoviePlayerUrl(
    imdbId: string,
  ): string | null {
    const normalizedImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    if (!isValidImdbId(normalizedImdbId)) return null;
    const params = new URLSearchParams({ type: 'movies', imdb: normalizedImdbId });
    return `https://superflixhd.epizy.com/embed-2/?${params.toString()}`;
  }

  /**
   * Gera URL do iframe oficial do SuperFlixHD para séries
   * utilizando os parâmetros padronizados:
   *  - type: "tvshows"
   *  - imdb: IMDb ID (com ou sem prefixo "tt")
   *
   * Retorna null se o IMDb ID não bater com o formato esperado.
   */
  getSeriesPlayerUrl(
    imdbId: string,
  ): string | null {
    const normalizedImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    if (!isValidImdbId(normalizedImdbId)) return null;
    const params = new URLSearchParams({ type: 'tvshows', imdb: normalizedImdbId });
    return `https://superflixhd.epizy.com/embed-2/?${params.toString()}`;
  }
}

export const superFlixApiService = new SuperFlixApiService();
