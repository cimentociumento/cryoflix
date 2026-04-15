import { HttpClient } from '../../../../shared/infrastructure/http/HttpClient';
import { env } from '../../../../config/environment';
import { logger } from '../../../../shared/utils/logger';

/**
 * SuperEmbedAdapter - Adaptador para integração com SuperEmbed
 * 
 * Conforme documentação do SuperEmbed:
 * - Método Simples: URL direta no iframe
 * - Método VIP: Usar directstream.php para player VIP (menos ads, melhor qualidade)
 * 
 * Estamos usando o método VIP (directstream.php) quando IMDB ID está disponível,
 * pois oferece melhor experiência (qualidade múltipla, HLS rápido, legendas).
 * 
 * Quando não há IMDB ID, usamos o método simples com TMDb ID.
 */
export class SuperEmbedAdapter {
  private readonly http = HttpClient.create({ timeout: 10000 }); // Aumentado para 10s
  private readonly baseUrl = env.superEmbed.baseUrl;

  /**
   * Gera URL do SuperEmbed para embed
   * 
   * Prioridade:
   * 1. Se tem IMDB ID: usa directstream.php (VIP player) - melhor qualidade, menos ads
   * 2. Se não tem IMDB ID: usa método simples com TMDb ID
   * 
   * @param movieId - TMDb ID do filme
   * @param imdbId - IMDB ID do filme (opcional, mas recomendado)
   * @returns URL do player SuperEmbed
   */
  async getEmbedUrl(movieId: number, imdbId?: string): Promise<string> {
    // Normalizar IMDB ID (remover 'tt' se presente, mas manter formato correto)
    const normalizedImdbId = imdbId ? this.normalizeImdbId(imdbId) : null;

    // Se temos IMDB ID, usar VIP player (directstream.php)
    // VIP player oferece: múltipla qualidade, HLS rápido, legendas, apenas 1 popup ad
    if (normalizedImdbId) {
      const vipUrl = this.buildVipUrl(normalizedImdbId);
      logger.debug({ movieId, imdbId: normalizedImdbId, url: vipUrl }, 'SuperEmbed: usando VIP player');
      return vipUrl;
    }

    // Fallback: usar método simples com TMDb ID
    const simpleUrl = this.buildSimpleUrl(movieId);
    logger.debug({ movieId, url: simpleUrl }, 'SuperEmbed: usando método simples (TMDb ID)');
    return simpleUrl;
  }

  /**
   * Constrói URL do VIP player (directstream.php)
   * Formato: https://multiembed.mov/directstream.php?video_id=tt8385148
   */
  private buildVipUrl(imdbId: string): string {
    const params = new URLSearchParams();
      params.append('video_id', imdbId);
    // Não precisa de tmdb=0 quando usa IMDB ID direto
    return `${this.baseUrl}/directstream.php?${params.toString()}`;
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

  /**
   * Normaliza IMDB ID
   * Aceita: 'tt0137523' ou '0137523' ou 'tt0137523'
   * Retorna: 'tt0137523' (formato completo)
   */
  private normalizeImdbId(imdbId: string): string {
    // Remove espaços e converte para minúsculas
    const cleaned = imdbId.trim().toLowerCase();
    
    // Se já começa com 'tt', retorna como está
    if (cleaned.startsWith('tt')) {
      return cleaned;
    }
    
    // Se é só número, adiciona 'tt' no início
    if (/^\d+$/.test(cleaned)) {
      return `tt${cleaned}`;
    }
    
    // Se já tem formato válido mas sem 'tt', adiciona
    return cleaned.startsWith('tt') ? cleaned : `tt${cleaned}`;
  }
}


