import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../app/providers/AuthProvider';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { Button } from '../../shared/components/Button/Button';
import { Modal } from '../../shared/components/Modal/Modal';
import { PlayerApiSelector, type StreamingApi } from './components/PlayerApiSelector';
import {
  metadataService,
  playerService,
  subtitleService,
} from '../../services/api';

export const WatchPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const movieId = Number(videoId);
  const isValidId = Number.isFinite(movieId);
  const { user, refreshProfile } = useAuth();

  const {
    data: movie,
    isLoading: loadingMovie,
    isError: movieError,
  } = useQuery({
    queryKey: ['metadata', movieId],
    queryFn: () => metadataService.getMovie(movieId),
    enabled: isValidId,
  });

  const {
    data: embedSource,
    isLoading: loadingEmbed,
    isError: embedError,
    refetch: refetchEmbed,
  } = useQuery({
    queryKey: ['player', movie?.id ?? movieId, movie?.imdbId],
    queryFn: () => playerService.getEmbed(movie!.id, movie?.imdbId ?? undefined),
    enabled: Boolean(movie) && isValidId,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 300000,
  });

  const { data: brazilDubInfo } = useQuery({
    queryKey: ['brazilian-dub', movie?.id],
    queryFn: () => metadataService.getBrazilianDubInfo(movie!.id),
    enabled: Boolean(movie?.id),
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });

  const {
    data: subtitles = [],
    isLoading: loadingSubtitles,
  } = useQuery({
    queryKey: ['subtitles', movieId],
    queryFn: () => subtitleService.search({ movieId }),
    enabled: Boolean(movie),
  });

  const progressQuery = useQuery({
    queryKey: ['progress', movieId, user?.id],
    queryFn: () => playerService.getProgress(movieId),
    enabled: Boolean(user && movie),
    retry: 0,
  });

  const saveProgress = useMutation({
    mutationFn: (progress: number) =>
      playerService.saveProgress({ movieId, progress }),
    onSuccess: () => {
      progressQuery.refetch();
      // Atualiza o perfil em memória para refletir o histórico no Home
      refreshProfile();
    },
  });

  const progressPercent = useMemo(() => {
    if (!progressQuery.data) {
      return 0;
    }
    return Math.round(progressQuery.data.progress * 100);
  }, [progressQuery.data]);

  const [isApiSelectorOpen, setIsApiSelectorOpen] = useState(false);

  const handleOpenPlayer = () => {
    setIsApiSelectorOpen(true);
  };

  const handleApiSelect = (api: StreamingApi, url: string) => {
    if (api === 'superflix' && movie?.imdbId) {
      // Para SuperFlix, navegar para a página dedicada com iframe
      const normalizedImdbId = movie.imdbId.startsWith('tt') 
        ? movie.imdbId 
        : `tt${movie.imdbId}`;
      navigate(`/player/superflix/${normalizedImdbId}`);
    } else {
      // Para SuperEmbed e LetsEmbed, abrir em nova aba
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setIsApiSelectorOpen(false);
  };

  if (!videoId || !isValidId) {
    return <p className="text-smoke">Selecione um conteúdo válido para assistir.</p>;
  }

  if (loadingMovie) {
    return <p className="text-smoke">Carregando informações do título...</p>;
  }

  if (movieError || !movie) {
    return <p className="text-smoke">Não encontramos esse título nos metadados.</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-bone">Faça login para assistir</h2>
        <p className="text-smoke">Entre com sua conta para iniciar a sessão segura de streaming.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="flex flex-col gap-8">
        {loadingEmbed ? (
          <p className="text-smoke">Preparando player seguro...</p>
        ) : embedError || !embedSource ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-smoke">Não foi possível gerar o embed do player.</p>
            <Button variant="secondary" onClick={() => refetchEmbed()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="flex w-full min-h-[60vh] flex-col items-center justify-center rounded-xl border border-white/10 bg-black/50 px-8 py-12 text-center">
              <div className="mb-8">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 text-marquee"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <h2 className="mb-2 text-2xl">Assistir {movie.title}</h2>
                <p className="mb-6 text-[0.95rem] opacity-80">
                  Clique no botão abaixo para escolher uma API de streaming
                </p>
              </div>
              <Button
                onClick={handleOpenPlayer}
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                ▶ Assistir Agora
              </Button>
              {embedSource.quality && (
                <p className="mt-4 text-[0.85rem] opacity-60">
                  Qualidade: {embedSource.quality}
                </p>
              )}
            </div>
            <Modal
              isOpen={isApiSelectorOpen}
              onClose={() => setIsApiSelectorOpen(false)}
              title="Escolher API de Streaming"
            >
              <PlayerApiSelector
                imdbId={movie?.imdbId}
                movieId={movie.id}
                movieTitle={movie.title}
                superEmbedUrl={embedSource.embedUrl}
                onSelect={handleApiSelect}
                onClose={() => setIsApiSelectorOpen(false)}
              />
            </Modal>
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-3xl text-bone">{movie.title}</h1>
              <p className="text-smoke">{movie.overview}</p>
              <small className="text-xs text-smoke">
                Lançamento:{' '}
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString('pt-BR')
                  : 'Indisponível'}{' '}
                • Nota TMDb: {movie.voteAverage.toFixed(1)}
              </small>
              <div className="mb-2">
                {brazilDubInfo?.hasBrazilianDub ? (
                  <span className="text-[0.85rem] text-gold">
                    Dublagem BR oficial disponível (dados TMDB)
                  </span>
                ) : (
                  <span className="text-[0.85rem] text-smoke">
                    Informação de dublagem BR oficial indisponível
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => saveProgress.mutate(1)}
                  disabled={saveProgress.isPending}
                >
                  Marcar como concluído
                </Button>
                <span className="text-sm text-smoke">Progresso: {progressPercent}%</span>
              </div>
            </div>
          </>
        )}
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-xl text-bone">Legendas PT-BR</h3>
          {loadingSubtitles ? (
            <p className="text-smoke">Buscando legendas...</p>
          ) : subtitles.length ? (
            <ul className="flex flex-col gap-2">
              {subtitles.map((subtitle) => (
                <li
                  key={subtitle.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-velvet px-4 py-3"
                >
                  <span className="text-sm text-smoke">
                    {subtitle.format.toUpperCase()} •{' '}
                    {subtitle.isHighQuality ? 'Alta qualidade' : 'Disponível'} •{' '}
                    {subtitle.downloadCount} downloads
                  </span>
                  <a
                    href={subtitleService.getDownloadUrl(subtitle.fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-marquee hover:underline"
                  >
                    Baixar
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-smoke">Nenhuma legenda em PT-BR encontrada.</p>
          )}
        </section>
      </section>
      <aside className="flex flex-col gap-4">
        <h3 className="font-display text-xl text-bone">Recomendações</h3>
        <Recommendations movieId={movieId} />
      </aside>
    </div>
  );
};

const Recommendations = ({ movieId }: { movieId: number }) => {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', movieId],
    queryFn: () => metadataService.getRecommendations(movieId),
    enabled: Boolean(movieId),
  });

  if (isLoading) {
    return <p className="text-smoke">Carregando recomendações...</p>;
  }

  if (!recommendations.length) {
    return <p className="text-smoke">Nenhum título relacionado no momento.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {recommendations.slice(0, 4).map((recommendation) => (
        <VideoCard
          key={recommendation.id}
          video={{
            id: recommendation.id,
            title: recommendation.title,
            posterUrl: recommendation.posterUrl ?? undefined,
          }}
          subtitle={recommendation.isHighRated ? 'Alta avaliação' : undefined}
        />
      ))}
    </div>
  );
};

