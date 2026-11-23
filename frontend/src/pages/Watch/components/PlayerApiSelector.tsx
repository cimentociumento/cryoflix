import { Button } from '../../../shared/components/Button/Button';
import { superFlixApiService } from '../../../services/api/superFlixApiService';

export type StreamingApi =
  | 'superembed'
  | 'superflix'
  | 'letsembed'
  | 'embedwave'
  | 'pomfy'
  | '2embed'
  | 'vidspark'
  | 'superembed-stream';

const isValidTmdbId = (id: number) => Number.isInteger(id) && id > 0;
const isValidImdbId = (id: string | null | undefined): id is string =>
  typeof id === 'string' && /^ttd{7,8}$/.test(id);

type ExtraProvider = {
  api: StreamingApi;
  name: string;
  description: string;
  // Recebe IDs já validados; retorna null quando o filme não tem o ID exigido.
  buildUrl: (ids: { tmdbId: number; imdbId: string | null }) => string | null;
};

// Provedores externos abertos em nova aba (noopener/noreferrer), como SuperEmbed e LetsEmbed.
const EXTRA_PROVIDERS: ExtraProvider[] = [
  {
    api: 'embedwave',
    name: 'EmbedWave',
    description: 'Alternativa ao SuperEmbed/2Embed, sem anúncios injetados e com failover entre servidores. Usa TMDb ID.',
    buildUrl: ({ tmdbId }) => `https://embedwave.cc/embed/movie/${encodeURIComponent(tmdbId)}`,
  },
  {
    api: 'pomfy',
    name: 'Pomfy',
    description: 'Endpoint que redireciona para o conteúdo encontrado na web. Funciona só com TMDb ID.',
    buildUrl: ({ tmdbId }) => `https://api.pomfy.stream/filme/${encodeURIComponent(tmdbId)}`,
  },
  {
    api: '2embed',
    name: '2Embed',
    description: 'Uma das APIs mais tradicionais. Aceita IMDb ou TMDb ID.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://www.2embed.cc/embed/${encodeURIComponent(imdbId ?? tmdbId)}`,
  },
  {
    api: 'vidspark',
    name: 'VidSpark',
    description: 'Embed direto aceitando IMDb ou TMDb ID.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://vidspark.to/movie/${encodeURIComponent(imdbId ?? tmdbId)}`,
  },
  {
    api: 'superembed-stream',
    name: 'SuperEmbed (servidores extras)',
    description: 'Mais de 10 servidores, aceitando IMDb ou TMDb ID.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://superembed.stream/?${new URLSearchParams({ video_id: String(imdbId ?? tmdbId) })}`,
  },
];

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
  const normalizedImdbId = imdbId && !imdbId.startsWith('tt') ? `tt${imdbId}` : imdbId;
  const safeIds = isValidTmdbId(movieId)
    ? { tmdbId: movieId, imdbId: isValidImdbId(normalizedImdbId) ? normalizedImdbId : null }
    : null;

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
            className="mt-3 w-full"
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
              className="mt-3 w-full"
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
              className="mt-3 w-full"
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
            className="mt-3 w-full"
          >
            ▶ Assistir no LetsEmbed
          </Button>
        </div>
      </div>

      {safeIds ? (
        <div className="flex flex-col gap-4">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.25em] text-smoke">
            Mais provedores
          </h3>
          {EXTRA_PROVIDERS.map((provider) => {
            const url = provider.buildUrl(safeIds);
            return (
              <div
                key={provider.api}
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
              >
                <h3 className="m-0 mb-2 text-lg font-semibold text-bone">{provider.name}</h3>
                <p className="m-0 text-sm leading-relaxed text-smoke">{provider.description}</p>
                <Button
                  variant="secondary"
                  disabled={!url}
                  onClick={() => {
                    if (url) onSelect(provider.api, url);
                  }}
                  className="mt-3 w-full"
                >
                  ▶ Assistir no {provider.name}
                </Button>
              </div>
            );
          })}
          <p className="m-0 text-xs text-smoke/70">
            Provedores externos e instáveis: abrem em nova aba e podem exibir anúncios.
          </p>
        </div>
      ) : null}

      <div className="mt-2">
        <Button variant="secondary" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  );
};

