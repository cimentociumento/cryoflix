import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { metadataService } from '../../services/api/metadataService';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { useAuth } from '../../app/providers/AuthProvider';
import { Section } from '../../components/Section/Section';
import { userService } from '../../services/api/userService';
import { Button } from '../../shared/components/Button/Button';

export const CatalogPage = () => {
  const [query, setQuery] = useState('');
  const { user, refreshProfile } = useAuth();

  const lastWatchedMovieId = useMemo(() => {
    const first = user?.history?.[0];
    if (!first) return null;
    const id = Number(first.videoId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [user?.history]);

  const {
    data: recommended = [],
    isLoading: loadingRecommended,
    isFetching: fetchingRecommended,
    isError: recommendedError,
    refetch: refetchRecommended,
  } = useQuery({
    queryKey: ['recommended', user?.id, lastWatchedMovieId],
    enabled: Boolean(user?.id && lastWatchedMovieId && !query),
    queryFn: () => metadataService.getRecommendations(lastWatchedMovieId!),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const { data: movies = [], isFetching, isError, isSuccess, refetch } = useQuery({
    queryKey: ['movies', 'search', query],
    queryFn: () => (query ? metadataService.search(query) : metadataService.getTrending()),
    retry: false,
  });

  const hiddenMovieIds = useMemo(() => {
    const raw = user?.preferences?.hiddenMovieIds;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((value) => Number(value))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [user?.preferences]);

  const visibleMovies = useMemo(
    () => movies.filter((movie) => !hiddenMovieIds.includes(movie.id)),
    [movies, hiddenMovieIds],
  );

  const hideMovieMutation = useMutation({
    mutationFn: async (movieId: number) => {
      const nextHiddenIds = Array.from(new Set([...hiddenMovieIds, movieId]));
      await userService.updatePreferences({
        ...(user?.preferences ?? {}),
        hiddenMovieIds: nextHiddenIds,
      });
    },
    onSuccess: async () => {
      await refreshProfile();
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-bone">Catálogo</h1>
          <p className="text-sm text-smoke">Busca em tempo real no TMDb.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="catalog-search" className="text-xs text-smoke">
            Buscar filmes
          </label>
          <input
            id="catalog-search"
            className="rounded-full border border-white/10 bg-velvet px-4 py-2 text-bone placeholder:text-smoke focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
            placeholder="Ex: Inception, Matrix"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </header>
      {!query && user ? (
        <Section
          title="Recomendados para você"
          description={
            lastWatchedMovieId
              ? 'Baseado no último título assistido.'
              : 'Assista a um título para gerar recomendações.'
          }
        >
          {loadingRecommended ? (
            [...Array(4)].map((_, index) => (
              <div className="aspect-[2/3] animate-pulse rounded-lg bg-velvet" key={index} />
            ))
          ) : (
            <>
              {recommendedError ? (
                <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-velvet p-4">
                  <p className="text-sm text-bone">
                    Não foi possível carregar as recomendações. Tente novamente.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => void refetchRecommended()}
                    disabled={fetchingRecommended}
                  >
                    Tentar carregar recomendações novamente
                  </Button>
                </div>
              ) : null}
              {recommended.slice(0, 8).map((movie) => <VideoCard key={movie.id} video={movie} />)}
              {!recommended.length && !recommendedError ? (
                <div className="rounded-xl border border-white/10 bg-velvet p-4">
                  <p className="text-sm text-smoke">
                    {lastWatchedMovieId
                      ? 'Nenhuma recomendação disponível para este título.'
                      : 'Ainda não há recomendações. Assista a um título e volte aqui.'}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </Section>
      ) : null}
      {isFetching ? (
        <p role="status" className="text-sm text-smoke">
          {movies.length ? 'Atualizando conteúdo...' : 'Carregando conteúdo...'}
        </p>
      ) : null}
      {isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-velvet p-4">
          <p className="text-sm text-bone">
            {movies.length
              ? 'Não foi possível atualizar o catálogo. Os últimos resultados continuam abaixo.'
              : 'Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.'}
          </p>
          <Button variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visibleMovies.map((movie) => (
          <div key={movie.id}>
            <VideoCard video={movie} />
            {user ? (
              <Button
                variant="secondary"
                onClick={() => hideMovieMutation.mutate(movie.id)}
                disabled={hideMovieMutation.isPending}
                style={{ width: '100%', marginTop: '0.4rem' }}
              >
                Não tenho interesse
              </Button>
            ) : null}
          </div>
        ))}
        {isSuccess && !visibleMovies.length && !isFetching ? (
          <p className="text-sm text-smoke">
            {movies.length
              ? 'Todos os filmes desta lista estão ocultos pelas suas preferências.'
              : query
                ? 'Nenhum filme encontrado. Tente outra busca.'
                : 'Nenhum filme disponível no momento.'}
          </p>
        ) : null}
      </div>
    </div>
  );
};

