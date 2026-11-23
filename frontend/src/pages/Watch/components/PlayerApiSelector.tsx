import { Button } from '../../../shared/components/Button/Button';
import { superFlixApiService } from '../../../services/api/superFlixApiService';

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
    <div className="flex flex-col gap-6">
      <p className="m-0 leading-relaxed text-smoke">
        Escolha uma das APIs de streaming disponíveis para assistir{' '}
        <strong className="font-semibold text-bone">{movieTitle}</strong>:
      </p>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 text-lg font-semibold text-bone">SuperEmbed</h3>
            <span className="rounded-full bg-marquee px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bone">
              Recomendado
            </span>
          </div>
          <p className="m-0 text-sm leading-relaxed text-smoke">
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-bone">SuperFlix API</h3>
              <span className="rounded-full bg-marquee px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bone">
                Dublado
              </span>
            </div>
            <p className="m-0 text-sm leading-relaxed text-smoke">
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
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-bone">SuperFlix API</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-smoke">
                Indisponível
              </span>
            </div>
            <p className="m-0 text-sm leading-relaxed text-smoke">
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

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 text-lg font-semibold text-bone">LetsEmbed</h3>
            <span className="rounded-full bg-marquee px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bone">
              Dublado
            </span>
          </div>
          <p className="m-0 text-sm leading-relaxed text-smoke">
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

      <div className="mt-2">
        <Button variant="secondary" onClick={onClose} style={{ width: '100%' }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

