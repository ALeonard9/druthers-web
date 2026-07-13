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
  year: number | null;
  genre: string | null;
  director: string | null;
  actors: string | null;
  plot: string | null;
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

export interface TVShow {
  id: string;
  title: string;
  imdb: string | null;
  tvmaze: number | null;
  status: string | null;
  poster_url: string | null;
  premiered?: string | null;
  year: number | null;
  genre: string | null;
  network: string | null;
  runtime: number | null;
  language?: string | null;
  rating: number | null;
  summary?: string | null;
}

export interface UserTVShow {
  id: string;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
  notes: string | null;
  status: string | null;
  freeze: number | null;
  tv_show: TVShow;
  created_at: string;
  updated_at: string;
}

export interface TVEpisode {
  id: string;
  title: string;
  tvmaze: number | null;
  airdate: string | null;
  season: number | null;
  season_number: number | null;
}

export interface UserTVEpisode {
  id: string;
  watched: number | null;
  episode: TVEpisode;
}

export interface TVShowSearchResult {
  tvmaze: number | null;
  imdb: string | null;
  title: string;
  year: string | null;
  status: string | null;
  network: string | null;
  poster_url: string | null;
}

export interface SessionUser {
  user_id: string;
  email: string;
  user_group: string;
}
