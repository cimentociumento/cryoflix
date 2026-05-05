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

  const { data: recommended = [], isFetching: fetchingRecommended } = useQuery({
    queryKey: ['recommended', user?.id, lastWatchedMovieId],
    enabled: Boolean(user?.id && lastWatchedMovieId && !query),
    queryFn: () => metadataService.getRecommendations(lastWatchedMovieId!),
    staleTime: 5 * 60_000,
  });

  const { data: movies = [], isFetching } = useQuery({
    queryKey: ['movies', 'search', query],
    queryFn: () => (query ? metadataService.search(query) : metadataService.getTrending()),
    enabled: true,
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
    <div className="page-stack">
      <header className="catalog-header">
        <div>
          <h1>Catálogo</h1>
          <p>Busca em tempo real no TMDb.</p>
        </div>
        <input
          className="search-input"
          placeholder="Buscar filmes (ex: Inception, Matrix)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {!query && user ? (
        <Section
          title="Recomendados para você"
          description={
            lastWatchedMovieId
              ? 'Baseado no último título marcado como concluído.'
              : 'Marque um título como concluído para gerar recomendações.'
          }
        >
          {fetchingRecommended ? (
            [...Array(4)].map((_, index) => <div className="skeleton-card" key={index} />)
          ) : recommended.length ? (
            recommended.slice(0, 8).map((movie) => <VideoCard key={movie.id} video={movie} />)
          ) : (
            <div className="auth-panel">
              <p style={{ margin: 0, opacity: 0.8 }}>
                Ainda não há recomendações. Conclua um título e volte aqui.
              </p>
            </div>
          )}
        </Section>
      ) : null}
      {isFetching ? <p>Carregando conteúdo...</p> : null}
      <div className="catalog-grid">
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
        {!visibleMovies.length && !isFetching ? (
          <p>{query ? 'Nenhum filme encontrado. Tente outra busca.' : 'Digite um termo para buscar filmes.'}</p>
        ) : null}
      </div>
    </div>
  );
};

