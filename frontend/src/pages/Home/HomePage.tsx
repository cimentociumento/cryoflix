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
  const { data: trending = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => metadataService.getTrending(),
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
        <Section title="Em Alta" description="Filmes populares do TMDb.">
          {loadingTrending
            ? [...Array(4)].map((_, index) => (
                <div className="aspect-[2/3] animate-pulse rounded-lg bg-velvet" key={index} />
              ))
            : trending.map((movie) => <VideoCard key={movie.id} video={movie} />)}
        </Section>
        {!user ? (
          <aside className="rounded-xl border border-white/10 bg-velvet p-6">
            <h3 className="font-display text-xl text-bone">Entrar ou criar conta</h3>
            <p className="mt-1 text-sm text-smoke">
              Use o e-mail demo ou cadastre um novo streaming user.
            </p>
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

