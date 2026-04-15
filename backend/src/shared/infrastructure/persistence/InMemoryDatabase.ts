import { randomUUID } from 'crypto';
import { hashSync } from 'bcryptjs';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  roles: string[];
  preferences: Record<string, unknown>;
  history: Array<{ videoId: string; watchedAt: Date; progress: number }>;
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
    const userId = randomUUID();
    const videoId = randomUUID();
    const subscriptionId = randomUUID();
    const now = new Date();

    this.users.set(userId, {
      id: userId,
      email: 'demo@fflix.io',
      passwordHash: hashSync('Sup3rSecret!', 10),
      name: 'Demo User',
      roles: ['viewer'],
      preferences: { language: 'pt-BR', theme: 'light' },
      history: [
        // Para integrar com o catálogo TMDb, usamos IDs numéricos como string.
        { videoId: '550', watchedAt: now, progress: 0.8 },
        { videoId: '680', watchedAt: now, progress: 0.5 },
      ],
    });

    this.videos.set(videoId, {
      id: videoId,
      title: 'Introducing FFlix',
      description: 'Visão geral da plataforma FFlix.',
      categories: ['Tech', 'Demo'],
      status: 'published',
      duration: 600,
      formats: ['mp4', 'hls'],
    });

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      userId,
      plan: 'premium',
      status: 'active',
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }
}

