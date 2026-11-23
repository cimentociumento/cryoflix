import { Button } from '../../../shared/components/Button/Button';
import { superFlixApiService } from '../../../services/api/superFlixApiService';

export type StreamingApi =
  | 'superembed'
  | 'superflix'
  | 'embedwave'
  | 'pomfy'
  | '2embed'
  | 'vidspark'
  | 'superembed-stream';

type Audio = 'dub' | 'sub';

type ProviderIds = {
  tmdbId: number;
  imdbId: string | null;
  superEmbedUrl: string;
};

type Provider = {
  api: StreamingApi;
  name: string;
  audio: Audio;
  description: string;
  recommended?: boolean;
  /** Mensagem exibida quando buildUrl retorna null (ID exigido ausente). */
  unavailableReason?: string;
  buildUrl: (ids: ProviderIds) => string | null;
};

const isValidTmdbId = (id: number) => Number.isInteger(id) && id > 0;
const isValidImdbId = (id: string | null | undefined): id is string =>
  typeof id === 'string' && /^tt\d{7,8}$/.test(id);

const PROVIDERS: Provider[] = [
  // ---- Dublados ----
  {
    api: 'superflix',
    name: 'SuperFlix',
    audio: 'dub',
    recommended: true,
    description: 'Filmes dublados em português, no player do CryoFlix. Pode pedir uma verificação do Cloudflare antes de tocar.',
    unavailableReason: 'Requer IMDb ID, indisponível para este filme.',
    buildUrl: ({ imdbId }) => (imdbId ? superFlixApiService.getMoviePlayerUrl(imdbId) : null),
  },
  {
    api: 'pomfy',
    name: 'Pomfy',
    audio: 'dub',
    description: 'Redireciona para o conteúdo encontrado na web. Usa TMDb ID.',
    buildUrl: ({ tmdbId }) => `https://api.pomfy.stream/filme/${encodeURIComponent(tmdbId)}`,
  },
  // ---- Legendados ----
  {
    api: 'superembed',
    name: 'SuperEmbed',
    audio: 'sub',
    recommended: true,
    description: 'Várias qualidades, HLS rápido e legendas integradas.',
    buildUrl: ({ superEmbedUrl }) => superEmbedUrl || null,
  },
  {
    api: 'superembed-stream',
    name: 'SuperEmbed (servidores extras)',
    audio: 'sub',
    description: 'Mais de 10 servidores alternativos.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://superembed.stream/?${new URLSearchParams({ video_id: String(imdbId ?? tmdbId) })}`,
  },
  {
    api: 'embedwave',
    name: 'EmbedWave',
    audio: 'sub',
    description: 'Sem anúncios injetados e com troca automática de servidor.',
    buildUrl: ({ tmdbId }) => `https://embedwave.cc/embed/movie/${encodeURIComponent(tmdbId)}`,
  },
  {
    api: '2embed',
    name: '2Embed',
    audio: 'sub',
    description: 'Um dos provedores mais tradicionais.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://www.2embed.cc/embed/${encodeURIComponent(imdbId ?? tmdbId)}`,
  },
  {
    api: 'vidspark',
    name: 'VidSpark',
    audio: 'sub',
    description: 'Embed direto, aceita IMDb ou TMDb ID.',
    buildUrl: ({ tmdbId, imdbId }) =>
      `https://vidspark.to/movie/${encodeURIComponent(imdbId ?? tmdbId)}`,
  },
];

const GROUPS: { audio: Audio; title: string; description: string }[] = [
  { audio: 'dub', title: 'Dublados', description: 'Áudio em português.' },
  { audio: 'sub', title: 'Legendados', description: 'Áudio original com legendas.' },
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
  const normalizedImdbId = imdbId && !imdbId.startsWith('tt') ? `tt${imdbId}` : imdbId;
  const ids: ProviderIds | null = isValidTmdbId(movieId)
    ? {
        tmdbId: movieId,
        imdbId: isValidImdbId(normalizedImdbId) ? normalizedImdbId : null,
        superEmbedUrl,
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <p className="m-0 leading-relaxed text-smoke">
        Escolha como assistir <strong className="font-semibold text-bone">{movieTitle}</strong>:
      </p>

      {GROUPS.map((group) => (
        <section key={group.audio} aria-labelledby={`providers-${group.audio}`} className="flex flex-col gap-2">
          <header className="flex items-baseline justify-between gap-3">
            <h3
              id={`providers-${group.audio}`}
              className="m-0 text-xs font-semibold uppercase tracking-[0.25em] text-bone"
            >
              {group.title}
            </h3>
            <span className="text-xs text-smoke">{group.description}</span>
          </header>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {PROVIDERS.filter((provider) => provider.audio === group.audio).map((provider) => {
              const url = ids ? provider.buildUrl(ids) : null;
              return (
                <li
                  key={provider.api}
                  className="flex flex-col gap-3 rounded-lg border border-bone/10 bg-ink/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-bone">{provider.name}</span>
                      {provider.recommended ? (
                        <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold">
                          Recomendado
                        </span>
                      ) : null}
                    </div>
                    <p className="m-0 mt-0.5 text-sm text-smoke">
                      {url ? provider.description : (provider.unavailableReason ?? 'Indisponível para este filme.')}
                    </p>
                  </div>
                  <Button
                    variant={provider.recommended ? 'primary' : 'secondary'}
                    disabled={!url}
                    aria-label={`Assistir no ${provider.name}`}
                    onClick={() => {
                      if (url) onSelect(provider.api, url);
                    }}
                    className="shrink-0 sm:w-32"
                  >
                    ▶ Assistir
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="m-0 text-xs text-smoke/70">
        Provedores externos e instáveis: com exceção do SuperFlix, abrem em nova aba e podem exibir anúncios.
      </p>

      <Button variant="ghost" onClick={onClose} className="w-full">
        Cancelar
      </Button>
    </div>
  );
};
