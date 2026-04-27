import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { superFlixApiService } from '../../services/api/superFlixApiService';
import styles from './SuperFlixPlayerPage.module.css';

export const SuperFlixPlayerPage = () => {
  const { imdbId } = useParams<{ imdbId: string }>();
  const navigate = useNavigate();

  const playerUrl = imdbId ? superFlixApiService.getMoviePlayerUrl(imdbId) : '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!imdbId) {
    return (
      <div className={styles.errorContainer}>
        <p>IMDb ID não fornecido</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Voltar
        </button>
        <h2 className={styles.title}>SuperFlix Player</h2>
      </div>
      <div className={styles.playerContainer}>
        <iframe
          src={playerUrl}
          title="SuperFlix Player"
          className={styles.player}
          width="100%"
          height="500"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          scrolling="no"
          frameBorder={0}
        />
      </div>
    </div>
  );
};

