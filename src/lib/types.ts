// Shared types mirroring the druthers-api /v1 responses.

export interface Movie {
  id: string;
  title: string;
  tmdb: number | null;
  imdb: string | null;
  release_date: string | null;
  /** Legacy OMDb-era value, frozen and never displayed (druthers-api#163). */
  rating_imdb: number | null;
  rating_tmdb: number | null;
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
  completed_at: string | null;
  movie: Movie;
  created_at: string;
  updated_at: string;
}

export interface MovieSearchResult {
  /** TMDB id is the catalog key; TMDB's title search returns no IMDb id. */
  tmdb: number;
  imdb: string | null;
  title: string;
  year: string | null;
  poster_url: string | null;
  type: string | null;
  popularity: number | null;
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
}

/** One streaming service a title is available on (druthers-api watch-providers). */
export interface WatchProvider {
  provider_id: number | null;
  name: string;
  logo_url: string | null;
}

/**
 * Where a title can be watched in one region. Live TMDB/JustWatch data — the
 * API never 404s here, it returns empty buckets, so callers check the tiers
 * rather than the response.
 */
export interface WatchProviders {
  region: string;
  link: string | null;
  /** The credit TMDB requires wherever this data is shown ("JustWatch"). */
  attribution: string;
  stream: WatchProvider[];
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
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
  completed_at: string | null;
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
  favorited: boolean | null;
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
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
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
  completed_at: string | null;
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
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
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
  completed_at: string | null;
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
  on_watchlist: boolean;
  on_rankings: boolean;
  rank: number | null;
}

export interface ActivityItem {
  category: 'movie' | 'tv_show' | 'tv_episode' | 'game' | 'book';
  action: 'watchlist_added' | 'ranked' | 'marked_done' | 'watched_episode';
  title: string;
  subtitle: string | null;
  entity_id: string;
  poster_url: string | null;
  rank: number | null;
  occurred_at: string;
}

export interface BoredItem {
  category: 'movie' | 'tv_show' | 'game' | 'book';
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
  category: 'movie' | 'tv_show' | 'game' | 'book' | 'friend_request' | null;
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

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiKeyCreated extends ApiKey {
  /** Plaintext secret — present only in the creation response, never again. */
  key: string;
}

export type RankedListLength = '25' | '50' | '100' | 'all';

export interface Preferences {
  ranked_list_length: RankedListLength;
}

export type VisibilityTier = 'private' | 'friends' | 'public';

export interface Visibility {
  handle: string | null;
  visibility_profile: VisibilityTier;
  visibility_movies: VisibilityTier;
  visibility_tv: VisibilityTier;
  visibility_books: VisibilityTier;
  visibility_games: VisibilityTier;
  visibility_watchlist_movies: VisibilityTier;
  visibility_watchlist_tv: VisibilityTier;
  visibility_watchlist_books: VisibilityTier;
  visibility_watchlist_games: VisibilityTier;
}

// A friend or follow's counterpart — never email or visibility settings, only
// as much as a relationship should expose.
export interface RelatedUser {
  id: string;
  handle: string | null;
  display_name: string | null;
}

export interface Friend {
  id: string;
  user: RelatedUser;
  friends_since: string;
}

export interface FriendRequest {
  id: string;
  user: RelatedUser;
  requested_at: string;
}

export interface PendingFriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface Follow {
  id: string;
  user: RelatedUser;
  followed_at: string;
}

export interface PublicShelfItem {
  id: string;
  rank: number;
  title: string;
  year: number | null;
  poster_url: string | null;
}

export interface PublicWatchlistItem {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
}

export interface PublicShelf {
  category: string;
  slug: string;
  ranked_count: number;
  items: PublicShelfItem[];
  watchlist?: PublicWatchlistItem[];
  // Present alongside `watchlist` (#279) — the true watchlist total,
  // independent of however many items this response actually carries.
  watchlist_count?: number;
}

// Who the caller is to the profile owner (#277). ANONYMOUS is not signed in
// at all; NONE is signed in with no relationship — both see the same
// shelves, but only ANONYMOUS can't act on a follow button without signing
// in first.
export type ViewerRelationship = 'anonymous' | 'none' | 'friend' | 'self';

export interface PublicProfile {
  handle: string;
  display_name: string | null;
  shelves: PublicShelf[];
  total_ranked: number;
  viewer: {
    relationship: ViewerRelationship;
    following: boolean;
  };
}

/** One entry on a shelf's Top 5 (`/v1/users/me/summary`). */
export interface SummaryEntry {
  rank: number;
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
}

export interface SummaryShelf {
  category: 'movies' | 'tv' | 'books' | 'games';
  label: string;
  ranked_count: number;
  queued_count: number;
  public: boolean;
  top: SummaryEntry[];
}

/**
 * Everything the home page renders, in one request. Replaced four
 * full-collection fetches — see the API's app/services/summary.py.
 */
export interface Summary {
  handle: string | null;
  display_name: string | null;
  /** True only when a handle exists AND a shelf is opted public. */
  profile_public: boolean;
  shelves: SummaryShelf[];
  total_ranked: number;
}
