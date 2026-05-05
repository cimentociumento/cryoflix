import { env } from '../../../../config/environment';
import { logger } from '../../../../shared/utils/logger';

/**
 * SuperEmbedAdapter - Adaptador para integração com SuperEmbed
 * 
 * Usa o método simples com TMDb ID, que é o formato mais estável.
 * Alguns endpoints VIP (directstream.php) retornam 404 para parte dos títulos.
 */
export class SuperEmbedAdapter {
  private readonly baseUrl = env.superEmbed.baseUrl;

  /**
   * Gera URL do SuperEmbed para embed
   * 
   * @param movieId - TMDb ID do filme
   * @param imdbId - IMDB ID do filme (opcional, atualmente não utilizado)
   * @returns URL do player SuperEmbed
   */
  async getEmbedUrl(movieId: number, imdbId?: string): Promise<string> {
    const simpleUrl = this.buildSimpleUrl(movieId);
    logger.debug(
      { movieId, imdbId, url: simpleUrl },
      'SuperEmbed: usando método simples (TMDb ID)',
    );
    return simpleUrl;
  }

  /**
   * Constrói URL do método simples
   * Formato: https://multiembed.mov/?video_id=522931&tmdb=1
   */
  private buildSimpleUrl(movieId: number): string {
    const params = new URLSearchParams();
    params.append('video_id', movieId.toString());
    params.append('tmdb', '1'); // Sempre necessário quando usa TMDb ID
    return `${this.baseUrl}/?${params.toString()}`;
  }
}


