export enum VideoQuality {
  SD = '480p',
  HD = '720p',
  FULL_HD = '1080p',
}

export class VideoSource {
  constructor(
    public readonly movieId: number,
    public readonly embedUrl: string,
    public readonly quality: VideoQuality,
    public readonly isAvailable: boolean,
    private readonly createdAt: Date = new Date(),
  ) {}

  isExpired(expirationHours = 6): boolean {
    const diffMs = Date.now() - this.createdAt.getTime();
    return diffMs > expirationHours * 60 * 60 * 1000;
  }

  get sanitizedUrl(): string {
    return this.embedUrl.replace(/[<>"']/g, '');
  }
}


