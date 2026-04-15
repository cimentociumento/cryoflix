import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GetEmbedUrl } from '../../application/use-cases/GetEmbedUrl';
import { SaveWatchProgress } from '../../application/use-cases/SaveWatchProgress';
import { embedParamsSchema, embedQuerySchema, progressSchema } from '../validators/playerSchemas';
import { IPlayerRepository } from '../../domain/repositories/IPlayerRepository';
import { IMovieRepository } from '../../../metadata/domain/repositories/IMovieRepository';
import { logger } from '../../../../shared/utils/logger';

type AuthedRequest = Request & { user?: { sub?: string } };

export class PlayerController {
  constructor(
    private readonly getEmbedUrl: GetEmbedUrl,
    private readonly saveWatchProgress: SaveWatchProgress,
    private readonly repository: IPlayerRepository,
    private readonly movieRepository: IMovieRepository,
  ) {}

  getEmbed = async (req: Request, res: Response): Promise<void> => {
    const { movieId } = embedParamsSchema.parse(req.params);
    // Se imdbId não foi fornecido na query, buscar do filme
    let imdbId = embedQuerySchema.parse(req.query).imdbId;
    
    logger.debug({ movieId, imdbIdFromQuery: imdbId }, 'PlayerController.getEmbed: iniciando');
    
    if (!imdbId) {
      // Buscar o filme para obter o IMDB ID
      try {
        const movie = await this.movieRepository.findById(movieId);
        if (movie && movie.imdbId) {
          imdbId = movie.imdbId;
          logger.debug({ movieId, imdbId }, 'PlayerController.getEmbed: IMDB ID obtido do filme');
        } else {
          logger.warn({ movieId }, 'PlayerController.getEmbed: filme não encontrado ou sem IMDB ID');
        }
      } catch (error: any) {
        logger.error({ movieId, error: error.message }, 'PlayerController.getEmbed: erro ao buscar filme');
      }
    }
    
    const source = await this.getEmbedUrl.execute({ movieId, imdbId });
    
    logger.info({ 
      movieId, 
      imdbId, 
      embedUrl: source.embedUrl,
      quality: source.quality 
    }, 'PlayerController.getEmbed: URL gerada');
    
    res.status(StatusCodes.OK).json({
      movieId: source.movieId,
      embedUrl: source.sanitizedUrl,
      quality: source.quality,
    });
  };

  saveProgress = async (req: AuthedRequest, res: Response): Promise<void> => {
    const payload = progressSchema.parse(req.body);
    const userId = req.user?.sub as string | undefined;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    await this.saveWatchProgress.execute({
      movieId: payload.movieId,
      progress: payload.progress,
      userId,
    });

    res.status(StatusCodes.OK).json({ message: 'Progresso salvo' });
  };

  getProgress = async (req: AuthedRequest, res: Response): Promise<void> => {
    const { movieId } = embedParamsSchema.parse(req.params);
    const userId = req.user?.sub as string | undefined;
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Usuário não autenticado' });
      return;
    }

    const progress = await this.repository.getProgress(userId, movieId);
    res.status(StatusCodes.OK).json(progress ?? { movieId, progress: 0 });
  };
}
