import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ContentService } from '../../application/services/ContentService';
import { createVideoSchema } from '../validators/contentValidators';

export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = createVideoSchema.parse(req.body);
    const video = this.contentService.createVideo(payload);
    res.status(StatusCodes.CREATED).json(video);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const videos = this.contentService.listVideos(req.query.q as string | undefined);
    res.status(StatusCodes.OK).json(videos);
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const video = this.contentService.getVideoById(req.params.id);
    res.status(StatusCodes.OK).json(video);
  };

  publish = async (req: Request, res: Response): Promise<void> => {
    const video = this.contentService.publishVideo(req.params.id);
    res.status(StatusCodes.OK).json(video);
  };
}

