import { Button } from '../../../shared/components/Button/Button';
import { superFlixApiService } from '../../../services/api/superFlixApiService';
import styles from './PlayerApiSelector.module.css';

export type StreamingApi = 'superembed' | 'superflix' | 'letsembed';

type PlayerApiSelectorProps = {
  imdbId?: string | null;
  movieId: number;
  movieTitle: string;
  superEmbedUrl: string;
  onSelect: (api: StreamingApi, url: string) => void;
  onClose: () => void;
};

export const PlayerApiSelector = ({
  imdbId,
  movieId,
  movieTitle,
  superEmbedUrl,
  onSelect,
  onClose,
}: PlayerApiSelectorProps) => {
  const getSuperFlixUrl = (): string | null => {
    if (!imdbId) return null;
    return superFlixApiService.getMoviePlayerUrl(imdbId);
  };

  const getLetsEmbedUrl = (): string => {
    // LetsEmbed usa TMDb ID e tem seleção de idioma para conteúdo dublado
    return `https://letsembed.cc/embed/movie/?id=${movieId}`;
  };

  const superFlixUrl = getSuperFlixUrl();
  const hasSuperFlix = Boolean(superFlixUrl);
  const letsEmbedUrl = getLetsEmbedUrl();

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Escolha uma das APIs de streaming disponíveis para assistir <strong>{movieTitle}</strong>:
      </p>

      <div className={styles.options}>
        <div className={styles.option}>
          <div className={styles.optionHeader}>
            <h3>SuperEmbed</h3>
            <span className={styles.badge}>Recomendado</span>
          </div>
          <p className={styles.optionDescription}>
            Player VIP com múltiplas qualidades, HLS rápido e legendas integradas.
          </p>
          <Button
            onClick={() => {
              onSelect('superembed', superEmbedUrl);
            }}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            ▶ Assistir no SuperEmbed
          </Button>
        </div>

        {hasSuperFlix ? (
          <div className={styles.option}>
            <div className={styles.optionHeader}>
              <h3>SuperFlix API</h3>
              <span className={styles.badge}>Dublado</span>
            </div>
            <p className={styles.optionDescription}>
              Catálogo completo de filmes, séries e animes dublados em português com alta qualidade. Suporta personalização do player.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                onSelect('superflix', superFlixUrl!);
              }}
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              ▶ Assistir no SuperFlix
            </Button>
          </div>
        ) : (
          <div className={styles.option}>
            <div className={styles.optionHeader}>
              <h3>SuperFlix API</h3>
              <span className={styles.badgeDisabled}>Indisponível</span>
            </div>
            <p className={styles.optionDescription}>
              Requer IMDb ID para acessar. Este filme não possui identificador IMDb disponível.
            </p>
            <Button
              variant="secondary"
              disabled
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              ▶ Assistir no SuperFlix
            </Button>
          </div>
        )}

        <div className={styles.option}>
          <div className={styles.optionHeader}>
            <h3>LetsEmbed</h3>
            <span className={styles.badge}>Dublado</span>
          </div>
          <p className={styles.optionDescription}>
            Player com seleção de idioma para conteúdo dublado em português. Suporta múltiplas qualidades.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              onSelect('letsembed', letsEmbedUrl);
            }}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            ▶ Assistir no LetsEmbed
          </Button>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose} style={{ width: '100%' }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

