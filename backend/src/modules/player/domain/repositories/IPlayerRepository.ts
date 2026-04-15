import { VideoSource } from '../entities/VideoSource';

export interface PlayerProgress {
  movieId: number;
  userId: string;
  progress: number;
  updatedAt: Date;
}

export interface IPlayerRepository {
  getEmbedSource(movieId: number, imdbId?: string): Promise<VideoSource>;
  saveProgress(progress: PlayerProgress): Promise<void>;
  getProgress(userId: string, movieId: number): Promise<PlayerProgress | null>;
}


