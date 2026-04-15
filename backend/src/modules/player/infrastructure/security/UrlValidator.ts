/**
 * Hosts permitidos para o SuperEmbed
 * Conforme documentação oficial do SuperEmbed
 */
const ALLOWED_HOSTS = [
  'multiembed.mov',
  'superembed.org',
  'multiembed.mov.to',
  'getsuperembed.link', // URL usada pelo se_player.php
];

export class UrlValidator {
  /**
   * Valida se a URL é de um host permitido do SuperEmbed
   * 
   * @param url - URL a ser validada
   * @returns true se a URL é válida e de um host permitido
   */
  isValid(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Verifica se o hostname termina com algum dos hosts permitidos
      return ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }
}


