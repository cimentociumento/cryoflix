export enum SubtitleFormat {
  SRT = 'srt',
  VTT = 'vtt',
  ASS = 'ass',
}

export class Subtitle {
  constructor(
    public readonly id: string,
    public readonly movieId: number,
    public readonly language: string,
    public readonly format: SubtitleFormat,
    public readonly downloadCount: number,
    public readonly rating: number,
    public readonly fileId: number,
  ) {}

  get isPtBr(): boolean {
    return ['pt-BR', 'pb', 'pob'].includes(this.language);
  }

  get isHighQuality(): boolean {
    return this.rating >= 8 && this.downloadCount >= 100;
  }
}


