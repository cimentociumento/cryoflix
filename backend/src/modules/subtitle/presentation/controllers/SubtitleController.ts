import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SearchSubtitles } from '../../application/use-cases/SearchSubtitles';
import { DownloadSubtitle } from '../../application/use-cases/DownloadSubtitle';
import {
  downloadParamsSchema,
  subtitleQuerySchema,
} from '../validators/subtitleSchemas';

export class SubtitleController {
  constructor(
    private readonly searchSubtitles: SearchSubtitles,
    private readonly downloadSubtitle: DownloadSubtitle,
  ) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const { movieId, imdbId } = subtitleQuerySchema.parse(req.query);
    const subtitles = await this.searchSubtitles.execute({
      movieId,
      imdbId,
      language: 'pt-BR',
    });

    res.status(StatusCodes.OK).json(
      subtitles.map((subtitle) => ({
        id: subtitle.id,
        language: subtitle.language,
        format: subtitle.format,
        downloadCount: subtitle.downloadCount,
        rating: subtitle.rating,
        fileId: subtitle.fileId,
        isHighQuality: subtitle.isHighQuality,
      })),
    );
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const { fileId } = downloadParamsSchema.parse(req.params);
    const content = await this.downloadSubtitle.execute({ fileId });
    res
      .status(StatusCodes.OK)
      .setHeader('Content-Type', 'text/vtt')
      .send(content);
  };
}


