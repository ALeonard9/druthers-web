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
  source_handle?: string | null;
}

export interface MovieSearchResult {
  /** TMDB id is the catalog key; TMDB's title search returns no IMDb id. */
  tmdb: number;
  imdb: string | null;
  title: string;
  year: string | null;
  release_date: string | null;
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
 * Where a title can be watched in one region. Live TMDB/JustWatch data - the
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
  source_handle?: string | null;
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
  source_handle?: string | null;
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
  source_handle?: string | null;
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

export interface ActivityActor {
  id: string;
  handle: string | null;
  display_name: string | null;
}

/** An activity event returned by the friends/following social feed. */
export interface SocialActivityItem extends ActivityItem {
  actor: ActivityActor;
}

export interface SocialActivityPage {
  items: SocialActivityItem[];
  next_cursor: string | null;
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

export interface UserSearchResult {
  id: string;
  display_name: string;
  handle: string | null;
}

export interface UserSearchResponse {
  query: string;
  corrected: string | null;
  users: UserSearchResult[];
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
  /** Plaintext secret - present only in the creation response, never again. */
  key: string;
}

export type RankedListLength = '25' | '50' | '100' | 'all';

export interface Preferences {
  ranked_list_length: RankedListLength;
  /** IANA zone. Always concrete - the API resolves an unset column server-side. */
  time_zone: string;
  shelf_order: string[];
  enabled_shelves: string[];
}

export type VisibilityTier = 'private' | 'friends' | 'public';

export interface Visibility {
  handle: string | null;
  visibility_profile: VisibilityTier;
  /** Account-wide default used by shelf and watchlist fields with no override. */
  default_privacy: VisibilityTier;
  visibility_movies: VisibilityTier | null;
  visibility_tv: VisibilityTier | null;
  visibility_books: VisibilityTier | null;
  visibility_games: VisibilityTier | null;
  visibility_watchlist_movies: VisibilityTier | null;
  visibility_watchlist_tv: VisibilityTier | null;
  visibility_watchlist_books: VisibilityTier | null;
  visibility_watchlist_games: VisibilityTier | null;
}

// A friend or follow's counterpart - never email or visibility settings, only
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
  // Present alongside `watchlist` (#279) - the true watchlist total,
  // independent of however many items this response actually carries.
  watchlist_count?: number;
}

// Who the caller is to the profile owner (#277). ANONYMOUS is not signed in
// at all; NONE is signed in with no relationship - both see the same
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

export interface ComparisonItem {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  your_rank?: number;
  their_rank?: number;
  gap?: number;
  on_your_watchlist?: boolean;
}

export interface ComparisonDomain {
  category: 'movies' | 'tv' | 'books' | 'games';
  label: string;
  rankings_visible: boolean;
  watchlist_visible: boolean;
  common_watchlist: ComparisonItem[];
  recommendations: ComparisonItem[];
  biggest_gaps: ComparisonItem[];
  most_aligned: ComparisonItem[];
  shared_ranked_count: number;
  alignment_score: number | null;
  alignment_status: 'ready' | 'not_enough_overlap' | 'hidden';
  method: string;
}

export interface UserComparison {
  handle: string;
  display_name: string | null;
  relationship: 'none' | 'friend';
  domains: ComparisonDomain[];
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
 * full-collection fetches - see the API's app/services/summary.py.
 */
export interface Summary {
  handle: string | null;
  display_name: string | null;
  /** True only when a handle exists AND a shelf is opted public. */
  profile_public: boolean;
  shelves: SummaryShelf[];
  total_ranked: number;
  /** Ranked + queued across every shelf - zero means a genuinely empty account. */
  total_items: number;
  onboarding_completed: boolean;
  /** Whether the onboarding wizard should show: unfinished AND zero items added. */
  needs_onboarding: boolean;
}

// --- Admin console (issue #249) ---------------------------------------

export interface AdminUserRow {
  id: string;
  handle: string;
  display_name: string | null;
  email: string;
  user_group: string;
  status: string;
  created_at: string;
  /** Wrote something - the API has no sign-in tracking yet. Never label this "last active". */
  last_tracked_at: string | null;
  tracked_total: number;
}

export interface AdminUserListResponse {
  total: number;
  limit: number;
  offset: number;
  users: AdminUserRow[];
}

export interface AdminDomainCounts {
  ranked: number;
  watchlist: number;
  total: number;
}

export interface AdminUserVisibility {
  profile: string;
  default_privacy: string;
  movies: string | null;
  tv: string | null;
  books: string | null;
  games: string | null;
  watchlist_movies: string | null;
  watchlist_tv: string | null;
  watchlist_books: string | null;
  watchlist_games: string | null;
  share_activity: boolean;
}

export interface AdminUserDetail {
  id: string;
  handle: string;
  display_name: string | null;
  email: string;
  user_group: string;
  status: string;
  created_at: string;
  last_tracked_at: string | null;
  visibility: AdminUserVisibility;
  domains: {
    movies: AdminDomainCounts;
    tv: AdminDomainCounts;
    books: AdminDomainCounts;
    games: AdminDomainCounts;
  };
  social: {
    friends: number;
    followers: number;
    following: number;
  };
}

// Every field here is genuinely optional on the API side, actor included -
// not just handle/email. An actor can be fully absent (an expired-token
// denial that never resolved to an account) and a resolved actor can still
// be missing individual fields (their account was later deleted, which nulls
// the FK and falls back to whatever was denormalized at write time).
export interface AdminAuditActor {
  id: string | null;
  handle: string | null;
  email: string | null;
}

export interface AdminAuditEvent {
  id: number;
  created_at: string;
  actor: AdminAuditActor | null;
  target: AdminAuditActor | null;
  action: string;
  result: string;
  detail: Record<string, unknown> | null;
  request_id: string | null;
  method: string | null;
  path: string | null;
  status_code: number | null;
  source_ip: string | null;
}

export interface AdminAuditResponse {
  total: number;
  limit: number;
  offset: number;
  events: AdminAuditEvent[];
}

/** GET /v1/admin/impersonation - every live view-as session, across every admin. Never carries the token. */
export interface AdminLiveSession {
  session_id: string;
  acting_admin: { id: string; handle: string | null; display_name: string | null; email: string | null };
  target: { id: string; handle: string | null; display_name: string | null; email: string | null };
  started_at: string;
  expires_at: string;
}

export interface AdminLiveSessionList {
  sessions: AdminLiveSession[];
}
