import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { playerService } from '../../../services/api/playerService';
import { Button } from '../../../shared/components/Button/Button';
import { tokenStore } from '../../../shared/api/tokenStore';
import type { WatchProgress } from '../../../shared/types';
import { formatWatchTime } from '../../../shared/utils/watchTime';
import { Panel } from '../../../shared/components/ui/Panel';
import { Notice } from '../../../shared/components/ui/Notice';
import { controlClassName } from '../../../shared/components/ui/Field';

type Position = { progress: number; timestamp: number };

export const WatchProgressPanel = ({
  movieId,
  userId,
  refreshProfile,
}: {
  movieId: number;
  userId: string;
  refreshProfile: () => Promise<void>;
}) => {
  const client = useQueryClient();
  const queryKey = ['progress', movieId, userId];
  const progress = useQuery({
    queryKey,
    queryFn: () => playerService.getProgress(movieId),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const ready = useRef(false);
  const restoring = useRef(false);
  const interacted = useRef(false);
  const completedExplicitly = useRef(false);
  const mounted = useRef(true);
  const token = useRef(tokenStore.get());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pendingCount = useRef(0);
  const lastPosition = useRef<Position | null>(null);
  const savedPosition = useRef<Position>({ timestamp: 0, progress: 0 });
  const [source, setSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [manualSaved, setManualSaved] = useState(false);

  useEffect(() => {
    if (progress.data) {
      savedPosition.current = {
        timestamp: progress.data.timestamp ?? 0,
        progress: progress.data.progress,
      };
    }
  }, [progress.data]);

  const save = useCallback((position: Position, updateProfile = false) => {
    token.current = tokenStore.get();
    const recordedAt = new Date().toISOString();
    pendingCount.current += 1;
    setSaving(true);
    const task = queue.current.catch(() => undefined).then(async () => {
      if (!mounted.current) return;
      await playerService.saveProgress({ movieId, ...position, recordedAt });
      if (!mounted.current) return;
      savedPosition.current = position;
      client.setQueryData<WatchProgress>(['progress', movieId, userId], {
        movieId, ...position, updatedAt: new Date().toISOString(),
      });
      setSaveError(null);
      void client.invalidateQueries({ queryKey: ['account-history', userId] });
      if (updateProfile) await refreshProfile();
    });
    queue.current = task;
    void task.catch(() => {
      if (mounted.current) setSaveError('Não foi possível salvar o ponto de reprodução. Tente novamente.');
    }).finally(() => {
      pendingCount.current -= 1;
      if (mounted.current) setSaving(pendingCount.current > 0);
    });
    return task;
  }, [client, movieId, refreshProfile, userId]);

  const currentPosition = useCallback((): Position | null => {
    const video = videoRef.current;
    if (!video || !ready.current || !interacted.current || completedExplicitly.current || restoring.current || !Number.isFinite(video.duration) || video.duration <= 0) return null;
    return {
      timestamp: Math.floor(video.currentTime),
      progress: Math.min(1, Math.max(0, video.currentTime / video.duration)),
    };
  }, []);

  const saveVideo = useCallback((updateProfile = false) => {
    const position = currentPosition();
    if (!position) return;
    lastPosition.current = position;
    void save(position, updateProfile).catch(() => undefined);
  }, [currentPosition, save]);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) saveVideo();
    }, 10_000);
    const flush = () => {
      const position = currentPosition() ?? lastPosition.current;
      if (position) playerService.flushProgress({ movieId, ...position }, token.current);
    };
    window.addEventListener('pagehide', flush);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveVideo();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      flush();
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [currentPosition, movieId, saveVideo]);

  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source);
  }, [source]);

  const saved = progress.data;
  return (
    <Panel as="section" aria-label="Progresso de reprodução" className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-bone">Continuar assistindo</h2>
      {progress.isPending ? <p role="status" className="text-sm text-smoke">Carregando ponto salvo...</p> : null}
      {progress.isError ? (
        <Notice
          tone="error"
          action={<Button variant="secondary" onClick={() => void progress.refetch()}>Tentar carregar progresso novamente</Button>}
        >
          Não foi possível recuperar seu ponto de reprodução.
        </Notice>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-smoke">
          Último ponto salvo: <strong className="font-semibold text-bone">{formatWatchTime(saved.timestamp ?? 0)}</strong>
          {saved.progress >= 1 ? ' — concluído' : saved.progress > 0 ? ` — ${Math.round(saved.progress * 100)}%` : ''}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-xs font-medium tracking-wide text-smoke">
        Abrir vídeo do dispositivo
        <input
          className={`${controlClassName} file:mr-3 file:rounded-full file:border-0 file:bg-bone/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-bone`}
          type="file"
          accept="video/*"
          disabled={!progress.isSuccess || saving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            ready.current = false;
            restoring.current = false;
            interacted.current = false;
            completedExplicitly.current = false;
            lastPosition.current = null;
            setMediaError(null);
            setSource(URL.createObjectURL(file));
          }}
        />
      </label>
      <p className="text-xs text-smoke">O arquivo fica no seu dispositivo. O ponto é salvo automaticamente ao pausar, avançar ou a cada 10 segundos de reprodução. Ao voltar, selecione novamente o mesmo arquivo para continuar do ponto salvo.</p>
      {source ? (
        <video
          ref={videoRef}
          src={source}
          controls
          preload="metadata"
          aria-label="Player de vídeo local"
          className="max-h-[60vh] w-full rounded-lg bg-ink"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            const resume = savedPosition.current.progress >= 1 ? 0 : Math.min(savedPosition.current.timestamp, Math.max(0, video.duration - 0.1));
            ready.current = true;
            if (resume > 0) {
              restoring.current = true;
              video.currentTime = resume;
            }
          }}
          onPause={() => saveVideo(true)}
          onPlay={() => {
            interacted.current = true;
            completedExplicitly.current = false;
          }}
          onSeeked={() => {
            if (restoring.current) {
              restoring.current = false;
              return;
            }
            interacted.current = true;
            completedExplicitly.current = false;
            saveVideo(true);
          }}
          onEnded={() => saveVideo(true)}
          onError={() => {
            ready.current = false;
            setMediaError('Não foi possível abrir este vídeo. Selecione um arquivo em formato compatível com o navegador.');
          }}
        />
      ) : null}
      {source ? (
        <Button variant="secondary" onClick={() => {
          saveVideo(true);
          ready.current = false;
          interacted.current = false;
          videoRef.current?.pause();
          setSource(null);
          setMediaError(null);
        }}>Fechar vídeo do dispositivo</Button>
      ) : null}
      {mediaError ? <Notice tone="error">{mediaError}</Notice> : null}
      <details className="group rounded-lg border border-bone/10 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-bone marker:text-smoke focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee">
          Salvar um ponto de um player externo
        </summary>
        <p className="mt-2 text-xs text-smoke">Os players externos não informam automaticamente a posição ao CryoFlix. Anote o tempo aqui e, ao voltar, use esse marcador para ajustar o player externo.</p>
        <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault();
          const minuteValue = Number(minutes);
          const secondValue = Number(seconds || '0');
          const timestamp = minuteValue * 60 + secondValue;
          if (minutes === '' || !Number.isInteger(minuteValue) || minuteValue < 0 || !Number.isInteger(secondValue) || secondValue < 0 || secondValue > 59 || timestamp > 2_147_483_647) {
            setSaveError('Informe minutos válidos e segundos entre 0 e 59.');
            return;
          }
          setManualSaved(false);
          lastPosition.current = { timestamp, progress: 0 };
          void save({ timestamp, progress: 0 }, true).then(() => {
            if (mounted.current) setManualSaved(true);
          }).catch(() => undefined);
        }}>
          <label className="flex w-28 flex-col gap-1.5 text-xs font-medium text-smoke">Minutos <input className={controlClassName} type="number" min="0" max="35791393" step="1" value={minutes} onChange={(event) => { setMinutes(event.target.value); setManualSaved(false); }} required disabled={!progress.isSuccess || saving || Boolean(source)} /></label>
          <label className="flex w-28 flex-col gap-1.5 text-xs font-medium text-smoke">Segundos <input className={controlClassName} type="number" min="0" max="59" step="1" value={seconds} onChange={(event) => { setSeconds(event.target.value); setManualSaved(false); }} disabled={!progress.isSuccess || saving || Boolean(source)} /></label>
          <Button type="submit" disabled={!progress.isSuccess || saving || Boolean(source)}>Salvar ponto do player externo</Button>
          {manualSaved ? <p role="status" className="w-full text-sm text-gold">Ponto de reprodução salvo.</p> : null}
        </form>
      </details>
      <Button variant="secondary" disabled={!progress.isSuccess || saving} onClick={() => {
        const timestamp = currentPosition()?.timestamp ?? saved?.timestamp ?? 0;
        videoRef.current?.pause();
        completedExplicitly.current = true;
        lastPosition.current = { timestamp, progress: 1 };
        void save({ timestamp, progress: 1 }, true).catch(() => undefined);
      }} className="self-start">Marcar como concluído</Button>
      {saving ? <p role="status" className="text-sm text-smoke">Salvando ponto de reprodução...</p> : null}
      {saveError ? (
        <Notice
          tone="error"
          action={lastPosition.current ? <Button variant="secondary" disabled={saving} onClick={() => {
            if (lastPosition.current) void save(lastPosition.current, true).catch(() => undefined);
          }}>Tentar salvar novamente</Button> : null}
        >
          {saveError}
        </Notice>
      ) : null}
    </Panel>
  );
};
