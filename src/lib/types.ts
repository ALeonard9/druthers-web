// Shared types mirroring the aleonard.us-api /v1 responses.

export interface Movie {
  id: string;
  title: string;
  imdb: string;
  release_date: string | null;
  rating_imdb: number | null;
  runtime: number | null;
  language: string | null;
  rated: string | null;
  poster_url: string | null;
}

export interface UserMovie {
  id: string;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
  completed: number | null;
  notes: string | null;
  movie: Movie;
  created_at: string;
  updated_at: string;
}

export interface MovieSearchResult {
  imdb: string;
  title: string;
  year: string | null;
  poster_url: string | null;
  type: string | null;
}

export interface SessionUser {
  user_id: string;
  email: string;
  user_group: string;
}
