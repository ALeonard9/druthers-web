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

export type WatchStatus = 'not_started' | 'behind' | 'up_to_date' | 'complete';

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
  // Present on the list endpoint: per-user progress for the status badge.
  watch_status?: WatchStatus;
  aired_count?: number;
  watched_count?: number;
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

export interface ScheduleEpisodeItem {
  show_id: string;
  show_title: string;
  episode_id: string;
  episode_title: string;
  season: number | null;
  season_number: number | null;
  airdate: string | null;
}

export interface ScheduleFrozenShow {
  show_id: string;
  show_title: string;
}

export interface Schedule {
  upcoming: ScheduleEpisodeItem[];
  catch_up: ScheduleEpisodeItem[];
  frozen_shows: ScheduleFrozenShow[];
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

export interface Book {
  id: string;
  title: string;
  isbn: string | null;
  googleid?: string | null;
  poster_url: string | null;
  authors: string | null;
  year: number | null;
  genre: string | null;
  description?: string | null;
  page_count: number | null;
  rating: number | null;
  language?: string | null;
}

export interface UserBook {
  id: string;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
  completed: number | null;
  notes: string | null;
  book: Book;
  created_at: string;
  updated_at: string;
}

export interface BookSearchResult {
  isbn: string | null;
  title: string;
  authors: string | null;
  year: string | null;
  poster_url: string | null;
}

export interface Country {
  id: string;
  title: string;
  country_code: string;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  population: number | null;
  flag_emoji: string | null;
  flag_url: string | null;
}

export interface UserCountry {
  id: string;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
  completed: number | null;
  notes: string | null;
  first_visited: string | null;
  country: Country;
  created_at: string;
  updated_at: string;
}

export interface VideoGame {
  id: string;
  title: string;
  igdb: number | null;
  poster_url: string | null;
  rating: number | null;
  time_to_beat: number | null;
  slug: string | null;
  year: number | null;
  genre: string | null;
  platforms: string | null;
  summary?: string | null;
  release_date?: string | null;
  igdb_last_update?: string | null;
}

export interface UserVideoGame {
  id: string;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
  completed: number | null;
  notes: string | null;
  is_100_percent: boolean | null;
  game: VideoGame;
  created_at: string;
  updated_at: string;
}

export interface GameSearchResult {
  igdb: number | null;
  title: string;
  slug: string | null;
  year: string | null;
  platforms: string | null;
  poster_url: string | null;
}

export interface ActivityItem {
  category: 'movie' | 'tv_show' | 'tv_episode' | 'game' | 'book' | 'country';
  action: 'watchlist_added' | 'ranked' | 'marked_done' | 'watched_episode';
  title: string;
  subtitle: string | null;
  entity_id: string;
  poster_url: string | null;
  rank: number | null;
  occurred_at: string;
}

export interface BoredItem {
  category: 'movie' | 'tv_show' | 'game' | 'book' | 'country';
  title: string;
  subtitle: string | null;
  entity_id: string;
  poster_url: string | null;
}

export interface BoredResponse {
  pick: BoredItem;
  pool_size: number;
}

export interface GlobalSearch {
  query: string;
  corrected: string | null;
  movies: MovieSearchResult[];
  tv_shows: TVShowSearchResult[];
  games: GameSearchResult[];
  books: BookSearchResult[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  category: 'movie' | 'tv_show' | 'game' | 'book' | 'country' | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export interface UnreadCount {
  unread: number;
}

export interface SessionUser {
  user_id: string;
  email: string;
  user_group: string;
}
