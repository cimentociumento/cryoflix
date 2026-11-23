import { useState } from 'react';
import toast from 'react-hot-toast';
import { useBlockedMovieMutations, useBlockedMoviesList, useMovieSearch } from '../../hooks/useBlockedMovies';

export const BlockedMoviesPage = () => {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data: blocked, isLoading: loadingBlocked } = useBlockedMoviesList();
  const { data: results, isLoading: loadingSearch } = useMovieSearch(query);
  const { block, unblock } = useBlockedMovieMutations();

  const blockedIds = new Set((blocked ?? []).map((m) => m.tmdbId));

  const applySearch = () => setQuery(searchInput.trim());

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-300">Buscar filme para bloquear</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-neutral-500" htmlFor="movie-search">
              Título
            </label>
            <input
              id="movie-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="mt-1 block rounded-md border border-[var(--color-cryo-border)] bg-black/30 px-2 py-1 text-sm"
              placeholder="Ex: Matrix"
            />
          </div>
          <button
            type="button"
            onClick={applySearch}
            className="rounded-md border border-neutral-600 px-3 py-1.5 text-xs"
          >
            Buscar
          </button>
        </div>

        {loadingSearch ? <p className="mt-3 text-sm text-neutral-500">Buscando…</p> : null}

        {results && results.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-cryo-border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/40 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Lançamento</th>
                  <th className="px-3 py-2">Nota</th>
                  <th className="px-3 py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {results.map((movie) => {
                  const isBlocked = blockedIds.has(movie.id);
                  return (
                    <tr key={movie.id} className="border-t border-[var(--color-cryo-border)]">
                      <td className="px-3 py-2">{movie.title}</td>
                      <td className="px-3 py-2 text-neutral-400">
                        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '—'}
                      </td>
                      <td className="px-3 py-2 text-neutral-400">{movie.voteAverage.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        {isBlocked ? (
                          <span className="text-xs text-neutral-500">Já bloqueado</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:underline"
                            disabled={block.isPending}
                            onClick={() =>
                              void block
                                .mutateAsync({
                                  tmdbId: movie.id,
                                  title: movie.title,
                                  posterPath: movie.posterUrl,
                                })
                                .then(() => toast.success(`"${movie.title}" bloqueado`))
                                .catch(() => toast.error('Falha ao bloquear'))
                            }
                          >
                            Bloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {query && !loadingSearch && (!results || results.length === 0) ? (
          <p className="mt-3 text-sm text-neutral-500">Nenhum filme encontrado.</p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-300">Filmes bloqueados</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-cryo-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/40 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Bloqueado por</th>
                <th className="px-3 py-2">Quando</th>
                <th className="px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loadingBlocked ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">
                    Carregando…
                  </td>
                </tr>
              ) : null}
              {blocked?.map((movie) => (
                <tr key={movie.id} className="border-t border-[var(--color-cryo-border)]">
                  <td className="px-3 py-2">{movie.title}</td>
                  <td className="px-3 py-2 text-neutral-400">{movie.blockedBy?.username ?? '—'}</td>
                  <td className="px-3 py-2 text-neutral-400">
                    {new Date(movie.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs text-[var(--color-cryo-accent)] hover:underline"
                      disabled={unblock.isPending}
                      onClick={() =>
                        void unblock
                          .mutateAsync(movie.tmdbId)
                          .then(() => toast.success(`"${movie.title}" desbloqueado`))
                          .catch(() => toast.error('Falha ao desbloquear'))
                      }
                    >
                      Desbloquear
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingBlocked && (!blocked || blocked.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">
                    Nenhum filme bloqueado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
