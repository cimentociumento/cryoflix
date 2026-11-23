import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useBlockedMoviesList = () =>
  useQuery({
    queryKey: ['admin', 'blocked-movies'],
    queryFn: () => adminApi.blockedMovies(),
  });

export const useMovieSearch = (query: string) =>
  useQuery({
    queryKey: ['admin', 'movie-search', query],
    queryFn: () => adminApi.searchMovies(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  });

export const useBlockedMovieMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'blocked-movies'] });

  const block = useMutation({
    mutationFn: (payload: { tmdbId: number; title: string; posterPath?: string | null; reason?: string }) =>
      adminApi.blockMovie(payload),
    onSuccess: invalidate,
  });

  const unblock = useMutation({
    mutationFn: (tmdbId: number) => adminApi.unblockMovie(tmdbId),
    onSuccess: invalidate,
  });

  return { block, unblock };
};
