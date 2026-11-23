import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { metadataService } from '../../services/api/metadataService';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { useAuth } from '../../app/providers/AuthProvider';
import { Section } from '../../components/Section/Section';
import { userService } from '../../services/api/userService';
import { Button } from '../../shared/components/Button/Button';
import { Notice } from '../../shared/components/ui/Notice';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { PosterSkeleton } from '../../shared/components/ui/PosterSkeleton';
import { controlClassName } from '../../shared/components/ui/Field';

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
      <PageHeader
        title="Catálogo"
        description="Busca em tempo real no TMDb."
        aside={
          <div className="flex w-full flex-col gap-1.5 sm:w-80">
            <label htmlFor="catalog-search" className="text-xs font-medium tracking-wide text-smoke">
              Buscar filmes
            </label>
            <input
              id="catalog-search"
              type="search"
              className={controlClassName}
              placeholder="Buscar filmes (ex: Inception, Matrix)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      />
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
            [...Array(4)].map((_, index) => <PosterSkeleton key={index} />)
          ) : (
            <>
              {recommendedError ? (
                <Notice
                  tone="error"
                  className="sm:!w-96"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => void refetchRecommended()}
                      disabled={fetchingRecommended}
                    >
                      Tentar carregar recomendações novamente
                    </Button>
                  }
                >
                  Não foi possível carregar as recomendações.
                </Notice>
              ) : null}
              {recommended.slice(0, 8).map((movie) => <VideoCard key={movie.id} video={movie} />)}
              {!recommended.length && !recommendedError ? (
                <Notice className="sm:!w-96">
                  {lastWatchedMovieId
                    ? 'Nenhuma recomendação disponível para este título.'
                    : 'Ainda não há recomendações. Assista a um título e volte aqui.'}
                </Notice>
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
        <Notice
          tone="error"
          action={
            <Button variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
              Tentar novamente
            </Button>
          }
        >
          {movies.length
            ? 'Não foi possível atualizar o catálogo. Os últimos resultados continuam abaixo.'
            : 'Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.'}
        </Notice>
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
                className="mt-2 w-full !px-3 !py-1.5 text-xs"
              >
                Não tenho interesse
              </Button>
            ) : null}
          </div>
        ))}
        {isSuccess && !visibleMovies.length && !isFetching ? (
          <p className="col-span-full text-sm text-smoke">
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

