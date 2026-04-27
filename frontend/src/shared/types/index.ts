export type Video = {
  id: string;
  title: string;
  description: string;
  categories?: string[];
  status?: 'draft' | 'processing' | 'published';
  duration?: number;
  formats?: string[];
  posterUrl?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  preferences: Record<string, unknown>;
  history: Array<{ videoId: string; watchedAt: string; progress: number }>;
};

export type PlaybackSession = {
  id: string;
  videoId: string;
  userId: string;
  manifestUrl: string;
  licenseUrl: string;
  streamUrl: string;
  lastHeartbeat: string;
};

export type MovieMetadata = {
  id: number;
  title: string;
  overview: string;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  voteAverage: number;
  genreIds: number[];
  isHighRated: boolean;
  imdbId?: string | null; // IMDB ID para integração com SuperEmbed
};

export type EmbedSource = {
  movieId: number;
  embedUrl: string;
  quality: '480p' | '720p' | '1080p';
};

export type WatchProgress = {
  movieId: number;
  progress: number;
  updatedAt?: string;
};

export type SubtitleOption = {
  id: string;
  language: string;
  format: string;
  downloadCount: number;
  rating: number;
  fileId: number;
  isHighQuality: boolean;
};

