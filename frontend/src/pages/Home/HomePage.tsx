import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Hero } from '../../components/Hero/Hero';
import { Button } from '../../shared/components/Button/Button';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { Section } from '../../components/Section/Section';
import { metadataService } from '../../services/api/metadataService';
import { useAuth } from '../../app/providers/AuthProvider';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm';
import { Notice } from '../../shared/components/ui/Notice';
import { Panel } from '../../shared/components/ui/Panel';
import { PosterSkeleton } from '../../shared/components/ui/PosterSkeleton';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const FALLBACK_BACKDROP =
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data: trending = [],
    isLoading: loadingTrending,
    isFetching: fetchingTrending,
    isError: trendingError,
    isSuccess: trendingSuccess,
    refetch: refetchTrending,
  } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => metadataService.getTrending(),
    retry: false,
  });

  const featured = trending[0];

  return (
    <div className="flex flex-col gap-12">
      <Hero
        eyebrow={featured ? 'Em alta hoje' : 'CryoFlix'}
        title={featured?.title ?? 'Encontre o próximo filme e dê play.'}
        description={
          featured?.overview || 'Os títulos em alta do momento, com histórico salvo para continuar de onde parou.'
        }
        background={
          featured?.backdropPath ? `${TMDB_BACKDROP_BASE}${featured.backdropPath}` : FALLBACK_BACKDROP
        }
        cta={
          featured ? (
            <Button onClick={() => navigate(`/watch/${featured.id}`)}>▶ Assistir</Button>
          ) : null
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {trendingError ? (
            <Notice
              tone="error"
              action={
                <Button
                  variant="secondary"
                  disabled={fetchingTrending}
                  onClick={() => void refetchTrending()}
                >
                  Tentar novamente
                </Button>
              }
            >
              Não foi possível carregar os filmes em alta. Tente novamente em instantes.
              {trending.length ? ' Os últimos resultados continuam disponíveis.' : ''}
            </Notice>
          ) : null}
          <Section title="Em Alta" description="Filmes populares do TMDb.">
            {loadingTrending
              ? [...Array(4)].map((_, index) => (
                  <PosterSkeleton key={index} />
                ))
              : trending.map((movie) => <VideoCard key={movie.id} video={movie} />)}
          </Section>
          {trendingSuccess && !trending.length && !fetchingTrending ? (
            <p className="text-sm text-smoke">Nenhum filme disponível no momento.</p>
          ) : null}
        </div>
        {!user ? (
          <Panel as="aside">
            <h3 className="font-display text-xl text-bone">Entrar ou criar conta</h3>
            <p className="mt-1 text-sm text-smoke">Entre com sua conta ou crie um cadastro.</p>
            <div className="mt-4">
              <LoginForm />
            </div>
          </Panel>
        ) : (
          <Panel as="aside">
            <h3 className="font-display text-xl text-bone">Bem-vindo, {user.name}</h3>
            <p className="mt-1 text-sm text-smoke">Escolha um título para continuar assistindo.</p>
            {featured ? (
              <div className="mt-4 w-40">
                <VideoCard video={featured} subtitle="Destaque do momento" />
              </div>
            ) : null}
          </Panel>
        )}
      </div>
    </div>
  );
};

