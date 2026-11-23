import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ListBlockedMoviesUseCase } from '../../application/use-cases/ListBlockedMovies';
import { BlockMovieUseCase } from '../../application/use-cases/BlockMovie';
import { UnblockMovieUseCase } from '../../application/use-cases/UnblockMovie';
import { blockMovieSchema, tmdbIdParamSchema } from '../validators/blockedMovieSchemas';

export class AdminMovieController {
  constructor(
    private readonly listBlockedMovies: ListBlockedMoviesUseCase,
    private readonly blockMovie: BlockMovieUseCase,
    private readonly unblockMovie: UnblockMovieUseCase,
  ) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const movies = await this.listBlockedMovies.execute();
    res.status(StatusCodes.OK).json(movies);
  };

  block = async (req: Request, res: Response): Promise<void> => {
    const body = blockMovieSchema.parse(req.body);
    const actorId = req.user!.id;
    const blocked = await this.blockMovie.execute({ ...body, blockedById: actorId });
    res.status(StatusCodes.CREATED).json(blocked);
  };

  unblock = async (req: Request, res: Response): Promise<void> => {
    const { tmdbId } = tmdbIdParamSchema.parse(req.params);
    await this.unblockMovie.execute(tmdbId);
    res.status(StatusCodes.NO_CONTENT).send();
  };
}
