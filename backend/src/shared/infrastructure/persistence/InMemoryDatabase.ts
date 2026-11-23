import { randomUUID } from 'crypto';

export type UserRecord = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  emailVerifyToken: string | null;
  emailVerifyExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
  preferences: Record<string, unknown>;
  history: Array<{ videoId: string; watchedAt: Date; progress: number; timestamp?: number }>;
  createdAt: Date;
  updatedAt: Date;
};

export type VideoRecord = {
  id: string;
  title: string;
  description: string;
  categories: string[];
  status: 'draft' | 'published' | 'processing';
  duration: number;
  formats: string[];
};

export type SubscriptionRecord = {
  id: string;
  userId: string;
  plan: 'basic' | 'standard' | 'premium';
  status: 'active' | 'pending' | 'cancelled';
  renewsAt: Date;
};

export type WatchProgressRecord = {
  userId: string;
  movieId: number;
  progress: number; // 0-1
  timestamp: number;
  updatedAt: Date;
};

export class InMemoryDatabase {
  private static instance: InMemoryDatabase;

  public readonly users = new Map<string, UserRecord>();
  public readonly videos = new Map<string, VideoRecord>();
  public readonly subscriptions = new Map<string, SubscriptionRecord>();
  public readonly watchProgress = new Map<string, WatchProgressRecord>(); // key: `${userId}:${movieId}`

  private constructor() {
    this.seed();
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  private seed(): void {
    const videoId = randomUUID();

    this.videos.set(videoId, {
      id: videoId,
      title: 'Introducing FFlix',
      description: 'Visão geral da plataforma FFlix.',
      categories: ['Tech', 'Demo'],
      status: 'published',
      duration: 600,
      formats: ['mp4', 'hls'],
    });
  }
}
