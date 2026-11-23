import { randomUUID } from 'crypto';
import { env } from '../../../../config/environment';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

type PlaybackSession = {
  id: string;
  videoId: string;
  userId: string;
  manifestUrl: string;
  licenseUrl: string;
  streamUrl: string;
  lastHeartbeat: Date;
};

export class StreamingService {
  private readonly sessions = new Map<string, PlaybackSession>();

  startSession(videoId: string, userId: string): PlaybackSession {
    const session: PlaybackSession = {
      id: randomUUID(),
      videoId,
      userId,
      manifestUrl: `${env.cdnBaseUrl}/videos/${videoId}/index.m3u8`,
      licenseUrl: `${env.cdnBaseUrl}/drm/${videoId}`,
      streamUrl: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',
      lastHeartbeat: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): PlaybackSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError('Sessão', sessionId);
    }
    return session;
  }

  heartbeat(sessionId: string): PlaybackSession {
    const session = this.getSession(sessionId);
    session.lastHeartbeat = new Date();
    return session;
  }
}

