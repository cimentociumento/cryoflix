import { InMemoryUserRepository } from '../modules/auth/infrastructure/repositories/InMemoryUserRepository';
import { JWTService } from '../modules/auth/infrastructure/services/JWTService';
import { IUserRepository } from '../modules/auth/domain/repositories/IUserRepository';
import { ITokenService } from '../modules/auth/application/services/ITokenService';
import { TMDbClient } from '../modules/metadata/infrastructure/http/TMDbClient';
import { MovieRepository } from '../modules/metadata/infrastructure/repositories/MovieRepository';
import { IMovieRepository } from '../modules/metadata/domain/repositories/IMovieRepository';
import { OpenSubtitlesAdapter } from '../modules/subtitle/infrastructure/adapters/OpenSubtitlesAdapter';
import { SubtitleRepository } from '../modules/subtitle/infrastructure/repositories/SubtitleRepository';
import { ISubtitleRepository } from '../modules/subtitle/domain/repositories/ISubtitleRepository';
import { SuperEmbedAdapter } from '../modules/player/infrastructure/adapters/SuperEmbedAdapter';
import { PlayerRepository } from '../modules/player/infrastructure/repositories/PlayerRepository';
import { IPlayerRepository } from '../modules/player/domain/repositories/IPlayerRepository';
import { getCacheProvider } from './infrastructure/cache/CacheProviderFactory';
import { ICacheProvider } from './infrastructure/cache/ICacheProvider';

// Repositórios
const userRepository: IUserRepository = new InMemoryUserRepository();
const tokenService: ITokenService = new JWTService();

// Clientes HTTP externos
const tmdbClient = new TMDbClient();
const openSubtitlesAdapter = new OpenSubtitlesAdapter();
const superEmbedAdapter = new SuperEmbedAdapter();

// Cache provider (singleton)
const cacheProvider: ICacheProvider = getCacheProvider();

// Repositórios de domínio
const movieRepository: IMovieRepository = new MovieRepository(tmdbClient);
const subtitleRepository: ISubtitleRepository = new SubtitleRepository(openSubtitlesAdapter);
const playerRepository: IPlayerRepository = new PlayerRepository(superEmbedAdapter);

export const container = {
  // Auth
  userRepository,
  tokenService,

  // Metadata
  movieRepository,
  tmdbClient,

  // Subtitles
  subtitleRepository,
  openSubtitlesAdapter,

  // Player
  playerRepository,
  superEmbedAdapter,

  // Cache
  cacheProvider,
};

