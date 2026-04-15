import { Entity } from '../../../../shared/domain/Entity';

export type MovieProps = {
  title: string;
  overview: string;
  releaseDate: Date | null;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  genreIds: number[];
  tmdbId: number; // ID original do TMDb
  imdbId?: string | null; // IMDB ID para melhor compatibilidade com players
};

export class Movie extends Entity<MovieProps> {
  private constructor(props: MovieProps, id: string) {
    super(props, id);
  }

  get title(): string {
    return this.props.title;
  }

  get overview(): string {
    return this.props.overview;
  }

  get releaseDate(): Date | null {
    return this.props.releaseDate;
  }

  get posterPath(): string | null {
    return this.props.posterPath;
  }

  get backdropPath(): string | null {
    return this.props.backdropPath;
  }

  get voteAverage(): number {
    return this.props.voteAverage;
  }

  get genreIds(): number[] {
    return this.props.genreIds;
  }

  get tmdbId(): number {
    return this.props.tmdbId;
  }

  get imdbId(): string | null | undefined {
    return this.props.imdbId;
  }

  get posterUrl(): string | null {
    if (!this.posterPath) {
      return null;
    }
    return `https://image.tmdb.org/t/p/w500${this.posterPath}`;
  }

  get isHighRated(): boolean {
    return this.voteAverage >= 7.5;
  }

  static create(props: MovieProps): Movie {
    // Usa o tmdbId como string para o id da entidade
    return new Movie(props, String(props.tmdbId));
  }

  static restore(props: MovieProps, id: string): Movie {
    return new Movie(props, id);
  }

  toJSON() {
    // Retorna id como número (tmdbId) para compatibilidade com frontend
    // O id da entidade (string) é mantido internamente
    // Garantir que posterUrl sempre seja gerado se posterPath existir
    const posterUrl = this.posterUrl || (this.posterPath ? `https://image.tmdb.org/t/p/w500${this.posterPath}` : null);
    
    return {
      id: this.tmdbId, // Compatibilidade: frontend espera id como number
      tmdbId: this.tmdbId,
      imdbId: this.imdbId ?? null,
      title: this.title,
      overview: this.overview || '',
      releaseDate: this.releaseDate?.toISOString() ?? null,
      posterUrl: posterUrl,
      posterPath: this.posterPath, // Incluir posterPath também para fallback
      backdropPath: this.backdropPath,
      voteAverage: this.voteAverage,
      genreIds: this.genreIds || [],
      isHighRated: this.isHighRated,
    };
  }
}


