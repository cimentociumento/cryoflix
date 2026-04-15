import { Subtitle } from '../entities/Subtitle';

export type SearchSubtitleParams = {
  movieId?: number;
  imdbId?: string;
  language?: string;
};

export interface ISubtitleRepository {
  search(params: SearchSubtitleParams): Promise<Subtitle[]>;
  download(fileId: number): Promise<string>;
}


