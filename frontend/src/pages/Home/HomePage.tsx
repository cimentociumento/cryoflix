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
    <div className="page-stack">
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
      <div className="home-grid">
        <div>
          <Section title="Em Alta" description="Filmes populares do TMDb.">
            {trendingError ? (
              <div className="auth-panel" role="alert">
                <p>
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
            {loadingTrending
              ? [...Array(4)].map((_, index) => (
                  <div className="skeleton-card" key={index} />
                ))
              : trending.map((movie) => <VideoCard key={movie.id} video={movie} />)}
            {trendingSuccess && !trending.length && !fetchingTrending ? (
              <p>Nenhum filme disponível no momento.</p>
            ) : null}
          </Section>
        </div>
        {!user ? (
          <aside className="auth-panel">
            <h3>Entrar ou criar conta</h3>
            <p>Entre com sua conta ou crie um cadastro.</p>
            <LoginForm />
          </aside>
        ) : (
          <aside className="auth-panel">
            <h3>Bem-vindo, {user.name}</h3>
            <p>Escolha um título para continuar assistindo.</p>
            {featured ? <VideoCard video={featured} subtitle="Destaque do momento" /> : null}
          </aside>
        )}
      </div>
    </div>
  );
};

