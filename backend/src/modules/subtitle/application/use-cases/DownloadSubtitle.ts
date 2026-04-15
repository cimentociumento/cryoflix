import { ISubtitleRepository } from '../../domain/repositories/ISubtitleRepository';
import { ValidationError } from '../../../../shared/domain/errors/ValidationError';

type Params = {
  fileId: number;
};

export class DownloadSubtitle {
  constructor(private readonly repository: ISubtitleRepository) {}

  async execute({ fileId }: Params): Promise<string> {
    if (!Number.isFinite(fileId) || fileId <= 0) {
      throw new ValidationError('Arquivo inválido');
    }

    return this.repository.download(fileId);
  }
}


