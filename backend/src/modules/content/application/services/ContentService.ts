import {
  InMemoryDatabase,
  VideoRecord,
} from '../../../../shared/infrastructure/persistence/InMemoryDatabase';
import { VideoAsset, VideoAssetProps } from '../../domain/entities/VideoAsset';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

export class ContentService {
  private readonly db = InMemoryDatabase.getInstance();

  createVideo(payload: Omit<VideoAssetProps, 'status'> & { status?: VideoAssetProps['status'] }) {
    const video = VideoAsset.create({
      ...payload,
      status: payload.status ?? 'draft',
    });

    const record: VideoRecord = {
      id: video.id,
      title: video.title,
      description: payload.description,
      categories: payload.categories,
      status: payload.status ?? 'draft',
      duration: payload.duration,
      formats: payload.formats,
    };

    this.db.videos.set(video.id, record);
    return record;
  }

  listVideos(query?: string) {
    const videos = Array.from(this.db.videos.values());
    if (!query) {
      return videos;
    }
    const normalized = query.toLowerCase();
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(normalized) ||
        video.description.toLowerCase().includes(normalized),
    );
  }

  getVideoById(id: string) {
    const video = this.db.videos.get(id);
    if (!video) {
      throw new ValidationError('Vídeo não encontrado');
    }
    return video;
  }

  publishVideo(id: string) {
    const video = this.db.videos.get(id);
    if (!video) {
      throw new ValidationError('Vídeo não encontrado');
    }

    video.status = 'published';
    this.db.videos.set(id, video);
    return video;
  }
}

