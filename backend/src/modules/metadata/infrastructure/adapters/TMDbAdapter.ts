import { Movie } from '../../domain/entities/Movie';
import { TMDbMovie } from '../http/TMDbClient';

export class TMDbAdapter {
  static toEntity(movie: TMDbMovie): Movie {
    // Extrair IMDB ID dos external_ids se disponível
    const imdbId = movie.external_ids?.imdb_id ?? null;
    
    return Movie.create({
      tmdbId: movie.id,
      imdbId: imdbId || undefined, // Converter null para undefined
      title: movie.title,
      overview: movie.overview,
      releaseDate: movie.release_date ? new Date(movie.release_date) : null,
      posterPath: movie.poster_path ?? null,
      backdropPath: movie.backdrop_path ?? null,
      voteAverage: movie.vote_average,
      genreIds: movie.genre_ids,
    });
  }
}


