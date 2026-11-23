import { httpClient, resolveApiBaseUrl } from '../../shared/api/httpClient';
import { tokenStore } from '../../shared/api/tokenStore';
import type { EmbedSource, WatchProgress } from '../../shared/types';

type ProgressPayload = {
  movieId: number;
  progress: number;
  timestamp: number;
  recordedAt?: string;
};

export const playerService = {
  async getEmbed(movieId: number, imdbId?: string) {
    const query = imdbId ? `?imdbId=${encodeURIComponent(imdbId)}` : '';
    return httpClient<EmbedSource>(`/player/${movieId}/embed${query}`);
  },
  async saveProgress(payload: ProgressPayload) {
    return httpClient<{ message: string }>('/player/progress', {
      method: 'POST',
      body: JSON.stringify({ ...payload, recordedAt: payload.recordedAt ?? new Date().toISOString() }),
    });
  },
  async getProgress(movieId: number) {
    return httpClient<WatchProgress>(`/player/${movieId}/progress`);
  },
  // pagehide/unmount não podem aguardar a fila normal. O token capturado
  // mantém o salvamento vinculado à conta que estava reproduzindo o vídeo.
  flushProgress(payload: ProgressPayload, token = tokenStore.get()) {
    if (!token) return;
    void fetch(`${resolveApiBaseUrl()}/player/progress`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...payload, recordedAt: payload.recordedAt ?? new Date().toISOString() }),
      keepalive: true,
    }).catch(() => undefined);
  },
};


