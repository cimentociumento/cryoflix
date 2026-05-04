class SuperFlixApiService {
  /**
   * Gera URL do iframe oficial do SuperFlixHD (superflixhd.epizy.com)
   * utilizando os parâmetros padronizados:
   *  - type: "movies" | "tvshows"
   *  - imdb: IMDb ID (com ou sem prefixo "tt")
   *
   * Exemplo final:
   * https://superflixhd.epizy.com/embed-2/?type=movies&imdb=tt1386697
   */
  getMoviePlayerUrl(
    imdbId: string,
  ): string {
    const normalizedImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    return `https://superflixhd.epizy.com/embed-2/?type=movies&imdb=${normalizedImdbId}`;
  }

  /**
   * Gera URL do iframe oficial do SuperFlixHD para séries
   * utilizando os parâmetros padronizados:
   *  - type: "tvshows"
   *  - imdb: IMDb ID (com ou sem prefixo "tt")
   */
  getSeriesPlayerUrl(
    imdbId: string,
  ): string {
    const normalizedImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    return `https://superflixhd.epizy.com/embed-2/?type=tvshows&imdb=${normalizedImdbId}`;
  }
}

export const superFlixApiService = new SuperFlixApiService();
