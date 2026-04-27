import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../app/providers/AuthProvider';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm';
import { userService } from '../../services/api/userService';
import { Button } from '../../shared/components/Button/Button';
import { metadataService } from '../../services/api/metadataService';
import { Section } from '../../components/Section/Section';
import { VideoCard } from '../../components/VideoCard/VideoCard';

export const AccountPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-stack">
        <h1>Minha conta</h1>
        <p>Faça login ou crie um perfil para sincronizar preferências.</p>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="account-header">
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <span className="badge badge-stable">{user.roles.join(', ')}</span>
      </header>

      <AccountHistory userId={user.id} />
      <PreferencesForm initialPreferences={user.preferences} />
    </div>
  );
};

const AccountHistory = ({ userId }: { userId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['account-history', userId],
    queryFn: () => userService.getHistory(userId),
    staleTime: 30_000,
  });

  const historyIds = useMemo(() => {
    const history = data?.history ?? [];
    return history
      .map((item) => Number(item.videoId))
      .filter((id) => Number.isFinite(id) && id > 0)
      .slice(0, 20);
  }, [data?.history]);

  const { data: movies = [], isLoading: loadingMovies } = useQuery({
    queryKey: ['account-history-movies', userId, historyIds.join(',')],
    enabled: Boolean(historyIds.length),
    queryFn: async () => {
      const results = await Promise.all(historyIds.map((id) => metadataService.getMovie(id)));
      return results;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Section title="Histórico" description="Títulos marcados como concluídos.">
        {[...Array(4)].map((_, idx) => (
          <div className="skeleton-card" key={idx} />
        ))}
      </Section>
    );
  }

  if (!data?.history?.length) {
    return (
      <Section title="Histórico" description="Títulos marcados como concluídos.">
        <div className="auth-panel">
          <p style={{ margin: 0, opacity: 0.8 }}>
            Seu histórico ainda está vazio. Para adicionar um título, abra um filme e clique em
            {' '}
            <strong>Marcar como concluído</strong>.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Histórico" description="Títulos marcados como concluídos.">
      {loadingMovies
        ? [...Array(4)].map((_, idx) => <div className="skeleton-card" key={idx} />)
        : movies.map((movie) => (
            <VideoCard key={movie.id} video={movie} subtitle="Concluído" />
          ))}
    </Section>
  );
};

const PreferencesForm = ({ initialPreferences }: { initialPreferences: Record<string, unknown> }) => {
  const [language, setLanguage] = useState((initialPreferences.language as string) ?? 'pt-BR');
  const [theme, setTheme] = useState((initialPreferences.theme as string) ?? 'dark');
  const { refreshProfile } = useAuth();
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => userService.updatePreferences({ language, theme }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['profile'] });
      refreshProfile();
    },
  });

  return (
    <form
      className="preferences-form"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h3>Preferências</h3>
      <label>
        Idioma
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="pt-BR">Português</option>
          <option value="en-US">Inglês</option>
        </select>
      </label>
      <label>
        Tema
        <select value={theme} onChange={(event) => setTheme(event.target.value)}>
          <option value="dark">Escuro</option>
          <option value="light">Claro</option>
        </select>
      </label>
      <Button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Salvando...' : 'Salvar preferências'}
      </Button>
      {mutation.isSuccess ? <span className="status success">Preferências atualizadas!</span> : null}
      {mutation.isError ? (
        <span className="status error">Erro ao salvar, tente novamente.</span>
      ) : null}
    </form>
  );
};

