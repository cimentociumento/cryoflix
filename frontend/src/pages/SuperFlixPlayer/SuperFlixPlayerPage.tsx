import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { superFlixApiService } from '../../services/api/superFlixApiService';

const BACK_BUTTON_CLASS =
  'rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-bone transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee sm:px-4';

export const SuperFlixPlayerPage = () => {
  const { imdbId } = useParams<{ imdbId: string }>();
  const navigate = useNavigate();

  const playerUrl = imdbId ? superFlixApiService.getMoviePlayerUrl(imdbId) : null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!imdbId || !playerUrl) {
    return (
      <div className="fixed inset-0 z-[1000] flex min-h-screen flex-col items-center justify-center gap-6 bg-ink">
        <p className="text-lg text-smoke">IMDb ID não fornecido ou inválido</p>
        <button onClick={() => navigate(-1)} className={BACK_BUTTON_CLASS}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-ink motion-safe:animate-fade-in">
      <div className="z-10 flex items-center gap-4 border-b border-white/10 bg-ink/80 px-4 py-4 sm:px-6">
        <button onClick={() => navigate(-1)} className={BACK_BUTTON_CLASS}>
          ← Voltar
        </button>
        <h2 className="m-0 font-display text-lg text-bone">SuperFlix Player</h2>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={playerUrl}
          title="SuperFlix Player"
          className="absolute inset-0 h-full w-full border-none"
          width="100%"
          height="500"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          scrolling="no"
          frameBorder={0}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-presentation"
        />
      </div>
    </div>
  );
};

