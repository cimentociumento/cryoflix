import { prisma } from './database/prismaClient';
import { InMemoryUserRepository } from '../modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { PrismaUserRepository } from '../modules/auth/infrastructure/repositories/PrismaUserRepository';
import { PrismaRefreshTokenRepository } from '../modules/auth/infrastructure/repositories/PrismaRefreshTokenRepository';
import { InMemoryRefreshTokenRepository } from '../modules/auth/infrastructure/repositories/InMemoryRefreshTokenRepository';
import { JWTService } from '../modules/auth/infrastructure/services/JWTService';
import { IUserRepository } from '../modules/auth/domain/repositories/IUserRepository';
import { ITokenService } from '../modules/auth/application/services/ITokenService';
import { IRefreshTokenRepository } from '../modules/auth/domain/repositories/IRefreshTokenRepository';
import { TMDbClient } from '../modules/metadata/infrastructure/http/TMDbClient';
import { MovieRepository } from '../modules/metadata/infrastructure/repositories/MovieRepository';
import { IMovieRepository } from '../modules/metadata/domain/repositories/IMovieRepository';
import { OpenSubtitlesAdapter } from '../modules/subtitle/infrastructure/adapters/OpenSubtitlesAdapter';
import { SubtitleRepository } from '../modules/subtitle/infrastructure/repositories/SubtitleRepository';
import { ISubtitleRepository } from '../modules/subtitle/domain/repositories/ISubtitleRepository';
import { SuperEmbedAdapter } from '../modules/player/infrastructure/adapters/SuperEmbedAdapter';
import { PlayerRepository } from '../modules/player/infrastructure/repositories/PlayerRepository';
import { InMemoryPlayerRepository } from '../modules/player/infrastructure/repositories/InMemoryPlayerRepository';
import { IPlayerRepository } from '../modules/player/domain/repositories/IPlayerRepository';
import { getCacheProvider } from './infrastructure/cache/CacheProviderFactory';
import { ICacheProvider } from './infrastructure/cache/ICacheProvider';
import { EmailService } from './services/EmailService';

const usePrisma = Boolean(process.env.DATABASE_URL?.trim());

const userRepository: IUserRepository = usePrisma
  ? new PrismaUserRepository(prisma)
  : new InMemoryUserRepository();

const refreshTokenRepository: IRefreshTokenRepository = usePrisma
  ? new PrismaRefreshTokenRepository(prisma)
  : new InMemoryRefreshTokenRepository();

const tokenService: ITokenService = new JWTService();
const emailService = new EmailService();

const tmdbClient = new TMDbClient();
const openSubtitlesAdapter = new OpenSubtitlesAdapter();
const superEmbedAdapter = new SuperEmbedAdapter();

const cacheProvider: ICacheProvider = getCacheProvider();

const movieRepository: IMovieRepository = new MovieRepository(tmdbClient);
const subtitleRepository: ISubtitleRepository = new SubtitleRepository(openSubtitlesAdapter);
const playerRepository: IPlayerRepository = usePrisma
  ? new PlayerRepository(superEmbedAdapter, prisma, userRepository)
  : new InMemoryPlayerRepository(superEmbedAdapter);

export const container = {
  prisma,
  userRepository,
  refreshTokenRepository,
  tokenService,
  emailService,
  movieRepository,
  tmdbClient,
  subtitleRepository,
  openSubtitlesAdapter,
  playerRepository,
  superEmbedAdapter,
  cacheProvider,
};
