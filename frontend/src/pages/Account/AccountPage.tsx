import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm';
import { userService } from '../../services/api/userService';
import { Button } from '../../shared/components/Button/Button';
import { metadataService } from '../../services/api/metadataService';
import { Section } from '../../components/Section/Section';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { formatWatchTime } from '../../shared/utils/watchTime';
import { Panel } from '../../shared/components/ui/Panel';
import { Field, controlClassName } from '../../shared/components/ui/Field';
import { Notice } from '../../shared/components/ui/Notice';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { PosterSkeleton } from '../../shared/components/ui/PosterSkeleton';

const adminUrl = import.meta.env.VITE_ADMIN_URL as string | undefined;

export const AccountPage = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [resetBanner, setResetBanner] = useState(false);

  useEffect(() => {
    if ((location.state as { resetOk?: boolean } | null)?.resetOk) {
      setResetBanner(true);
    }
  }, [location.state]);

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <PageHeader
          title="Minha conta"
          description="Entre ou crie uma conta para salvar seu histórico e preferências."
        />
        <Panel>
          <LoginForm />
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {resetBanner ? (
        <Notice tone="success">Senha alterada com sucesso. Faça login novamente se necessário.</Notice>
      ) : null}
      <PageHeader
        title={user.name}
        description={user.email}
        aside={
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-bone/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-smoke">
              {user.roles.join(', ')}
            </span>
            {isAdmin && adminUrl ? (
              <a
                href={adminUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-bone underline decoration-bone/30 underline-offset-4 hover:decoration-marquee"
              >
                Painel admin
              </a>
            ) : null}
          </div>
        }
      />

      <AccountHistory userId={user.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          initialDisplayName={user.displayName ?? user.name}
          initialBio={user.bio ?? ''}
        />
        <PreferencesForm initialPreferences={user.preferences} />
      </div>
    </div>
  );
};

const ProfileSection = ({
  initialDisplayName,
  initialBio,
}: {
  initialDisplayName: string;
  initialBio: string;
}) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const { refreshProfile } = useAuth();
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => userService.updateProfile({ displayName, bio: bio || null }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['profile'] });
      void refreshProfile();
    },
  });

  return (
    <Panel
      as="form"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h2 className="font-display text-xl text-bone">Perfil</h2>
      <Field label="Nome de exibição" htmlFor="profile-name">
        <input
          id="profile-name"
          className={controlClassName}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </Field>
      <Field label="Bio" htmlFor="profile-bio">
        <textarea
          id="profile-bio"
          className={`${controlClassName} resize-y`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
        />
      </Field>
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? 'Salvando...' : 'Salvar perfil'}
      </Button>
      {mutation.isSuccess ? <Notice tone="success">Perfil atualizado.</Notice> : null}
      {mutation.isError ? (
        <Notice tone="error">Não foi possível salvar o perfil. Tente novamente.</Notice>
      ) : null}
    </Panel>
  );
};

const AccountHistory = ({ userId }: { userId: string }) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['account-history', userId],
    queryFn: () => userService.getHistory(userId),
    staleTime: 30_000,
    retry: false,
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
      const results = await Promise.allSettled(historyIds.map((id) => metadataService.getMovie(id)));
      return results.map((result, index) => ({
        id: historyIds[index],
        movie: result.status === 'fulfilled' ? result.value : null,
      }));
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Section title="Histórico" description="Pontos de reprodução e títulos concluídos.">
        {[...Array(4)].map((_, idx) => (
          <PosterSkeleton key={idx} />
        ))}
      </Section>
    );
  }

  if (isError) {
    return (
      <Section title="Histórico" description="Pontos de reprodução e títulos concluídos.">
        <Notice
          tone="error"
          className="sm:!w-96"
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar seu histórico.
        </Notice>
      </Section>
    );
  }

  if (!data?.history?.length) {
    return (
      <Section title="Histórico" description="Pontos de reprodução e títulos concluídos.">
        <Notice className="sm:!w-96">
          Nada por aqui ainda. Abra um filme no catálogo e ele aparece neste histórico.
        </Notice>
      </Section>
    );
  }

  return (
    <Section title="Histórico" description="Pontos de reprodução e títulos concluídos.">
      {movies.some((item) => !item.movie) ? (
        <p role="status" className="text-sm text-smoke">
          Alguns dados dos filmes estão indisponíveis. Seus pontos de reprodução continuam salvos.
        </p>
      ) : null}
      {loadingMovies
        ? [...Array(4)].map((_, idx) => <PosterSkeleton key={idx} />)
        : movies.map(({ id, movie }) => {
            const entry = data.history.find((item) => item.videoId === String(id));
            const subtitle = entry && entry.progress >= 1
              ? 'Concluído'
              : entry?.timestamp
                ? `Continuar em ${formatWatchTime(entry.timestamp)}`
                : `${Math.round((entry?.progress ?? 0) * 100)}% assistido`;
            return <VideoCard key={id} video={movie ?? { id, title: `Filme ${id}` }} subtitle={subtitle} />;
          })}
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
    <Panel
      as="form"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h2 className="font-display text-xl text-bone">Preferências</h2>
      <Field label="Idioma" htmlFor="pref-language">
        <select
          id="pref-language"
          className={controlClassName}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="pt-BR">Português</option>
          <option value="en-US">Inglês</option>
        </select>
      </Field>
      <Field label="Tema" htmlFor="pref-theme">
        <select
          id="pref-theme"
          className={controlClassName}
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
        >
          <option value="dark">Escuro</option>
          <option value="light">Claro</option>
        </select>
      </Field>
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? 'Salvando...' : 'Salvar preferências'}
      </Button>
      {mutation.isSuccess ? <Notice tone="success">Preferências atualizadas.</Notice> : null}
      {mutation.isError ? <Notice tone="error">Não foi possível salvar. Tente novamente.</Notice> : null}
    </Panel>
  );
};

