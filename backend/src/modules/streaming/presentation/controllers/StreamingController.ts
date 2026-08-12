import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StreamingService } from '../../application/services/StreamingService';
import { sessionParamsSchema } from '../validators/streamingValidators';

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

  heartbeat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const { sessionId } = sessionParamsSchema.parse(req.params);
    const existing = this.streamingService.getSession(sessionId);
    if (existing.userId !== userId) {
      res.status(StatusCodes.FORBIDDEN).json({ message: 'Sessão pertence a outro usuário' });
      return;
    }

    const session = this.streamingService.heartbeat(sessionId);
    res.status(StatusCodes.OK).json(session);
  };
}

