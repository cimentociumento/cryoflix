import { randomUUID } from 'crypto';
import { Entity } from '../../../../shared/domain/Entity';

export type VideoAssetProps = {
  title: string;
  description: string;
  categories: string[];
  duration: number;
  status: 'draft' | 'processing' | 'published';
  formats: string[];
};

export class VideoAsset extends Entity<VideoAssetProps> {
  private constructor(props: VideoAssetProps, id: string) {
    super(props, id);
  }

  get title(): string {
    return this.props.title;
  }

  get status(): VideoAssetProps['status'] {
    return this.props.status;
  }

  publish(): VideoAsset {
    return new VideoAsset({ ...this.props, status: 'published' }, this.id);
  }

  static create(props: VideoAssetProps): VideoAsset {
    return new VideoAsset(props, randomUUID());
  }

  static restore(props: VideoAssetProps, id: string): VideoAsset {
    return new VideoAsset(props, id);
  }
}

