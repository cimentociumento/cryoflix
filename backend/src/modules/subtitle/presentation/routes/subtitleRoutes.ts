import { Router } from 'express';
import { container } from '../../../../shared/container';
import { SearchSubtitles } from '../../application/use-cases/SearchSubtitles';
import { DownloadSubtitle } from '../../application/use-cases/DownloadSubtitle';
import { SubtitleController } from '../controllers/SubtitleController';
import { safeHandler } from '../../../../shared/utils/safeHandler';

const controller = new SubtitleController(
  new SearchSubtitles(container.subtitleRepository, container.cacheProvider),
  new DownloadSubtitle(container.subtitleRepository),
);

export const subtitleRoutes = Router();

subtitleRoutes.get('/', safeHandler(controller.search));
subtitleRoutes.get('/:fileId/download', safeHandler(controller.download));


