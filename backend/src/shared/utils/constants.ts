export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mkv', 'mov', 'avi'] as const;
export const DEFAULT_STREAMING_PROTOCOLS = ['HLS', 'DASH'] as const;

export type VideoFormat = (typeof SUPPORTED_VIDEO_FORMATS)[number];

