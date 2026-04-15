import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RecommendationService } from '../../application/services/RecommendationService';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = (req.params.userId as string | undefined) ?? req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }
    const recommendations = this.recommendationService.getRecommendations(userId);
    res.status(StatusCodes.OK).json(recommendations);
  };

  feedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const { videoId, score } = req.body;
    const result = this.recommendationService.submitFeedback(userId, videoId, score);
    res.status(StatusCodes.CREATED).json(result);
  };
}

