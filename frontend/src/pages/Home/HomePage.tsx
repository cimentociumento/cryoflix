import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Hero } from '../../components/Hero/Hero';
import { Button } from '../../shared/components/Button/Button';
import { VideoCard } from '../../components/VideoCard/VideoCard';
import { Section } from '../../components/Section/Section';
import { metadataService } from '../../services/api/metadataService';
import { useAuth } from '../../app/providers/AuthProvider';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm';

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
        title="Assista aos lançamentos e continue exatamente de onde parou."
        description="Streaming adaptativo, múltiplos perfis e recomendações inteligentes prontos para o próximo grande lançamento."
        background="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80"
        cta={
          featured ? (
            <Button onClick={() => navigate(`/watch/${featured.id}`)}>Assistir destaque</Button>
          ) : null
        }
      />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          {trendingError ? (
            <div
              className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-velvet p-4"
              role="alert"
            >
              <p className="text-sm text-bone">
                Não foi possível carregar os filmes em alta. Tente novamente em instantes.
                {trending.length ? ' Os últimos resultados continuam disponíveis.' : ''}
              </p>
              <Button
                variant="secondary"
                disabled={fetchingTrending}
                onClick={() => void refetchTrending()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          <Section title="Em Alta" description="Filmes populares do TMDb.">
            {loadingTrending
              ? [...Array(4)].map((_, index) => (
                  <div className="aspect-[2/3] animate-pulse rounded-lg bg-velvet" key={index} />
                ))
              : trending.map((movie) => <VideoCard key={movie.id} video={movie} />)}
          </Section>
          {trendingSuccess && !trending.length && !fetchingTrending ? (
            <p className="text-sm text-smoke">Nenhum filme disponível no momento.</p>
          ) : null}
        </div>
        {!user ? (
          <aside className="rounded-xl border border-white/10 bg-velvet p-6">
            <h3 className="font-display text-xl text-bone">Entrar ou criar conta</h3>
            <p className="mt-1 text-sm text-smoke">Entre com sua conta ou crie um cadastro.</p>
            <div className="mt-4">
              <LoginForm />
            </div>
          </aside>
        ) : (
          <aside className="rounded-xl border border-white/10 bg-velvet p-6">
            <h3 className="font-display text-xl text-bone">Bem-vindo, {user.name}</h3>
            <p className="mt-1 text-sm text-smoke">Escolha um título para continuar assistindo.</p>
            {featured ? (
              <div className="mt-4 w-40">
                <VideoCard video={featured} subtitle="Destaque do momento" />
              </div>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
};

