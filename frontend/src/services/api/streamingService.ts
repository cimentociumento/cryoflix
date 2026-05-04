import { httpClient } from '../../shared/api/httpClient';
import type { PlaybackSession } from '../../shared/types';

export const streamingService = {
  async startPlayback(videoId: string) {
    return httpClient<PlaybackSession>(`/streaming/playback/${videoId}`);
  },
  async heartbeat(sessionId: string) {
    return httpClient<PlaybackSession>(`/streaming/sessions/${sessionId}/heartbeat`, {
      method: 'POST',
    });
  },
};

