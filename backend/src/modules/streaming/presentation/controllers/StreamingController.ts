import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StreamingService } from '../../application/services/StreamingService';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  playback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const session = this.streamingService.startSession(req.params.videoId, userId);
    res.status(StatusCodes.OK).json(session);
  };

  heartbeat = async (req: Request, res: Response): Promise<void> => {
    const session = this.streamingService.heartbeat(req.params.sessionId);
    res.status(StatusCodes.OK).json(session);
  };
}

