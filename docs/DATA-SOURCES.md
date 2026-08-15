# Data-source attribution & licensing

What each provider requires, what we display, and where. The user-facing
notices live on **`/about`** ("The data on the shelves"). Verified against
each provider's site 2026-07-18 (druthers-web#14).

| Provider | Used for | License / requirement (verified) | How we satisfy it |
|---|---|---|---|
| **TMDB** (themoviedb.org) | Movie search, detail, posters (`movie_search.py`, `tmdb.py`) | Required sentence *verbatim* + **unmodified** logo on every application using their data or images. No daily cap; ~40–50 req/s, 20 connections/IP, enforced by 429 | Logo (`public/tmdb.svg`) + exact sentence on /about. Client retries 429 with backoff. |
| **TVmaze** (tvmaze.com/api) | TV shows, episodes, air dates (`tv_search.py`) | **CC BY-SA 4.0**: "TVmaze is properly credited as source"; attribution satisfied "by linking back to TVmaze" | Credit + link + license link on /about; TV search page names TVMaze. |
| **Open Library** (openlibrary.org) | Book search, records, covers (`book_search.py`) | No hard attribution mandate found; courtesy credit expected (Internet Archive project) | Credit + link on /about; Books search page names Open Library. |
| **IGDB** (igdb.com, via Twitch OAuth) | Game search, detail, covers (`game_search.py`) | Terms page (api-docs.igdb.com) returned 403 during verification - standard practice per their developer docs is credit + link | Credit + link on /about. **Re-verify terms when the docs are reachable.** |

## Deliberately absent

- **OMDb** - *removed* in the TMDB migration (druthers-api#163). It was
  CC BY-NC (non-commercial only), which was the single hard blocker to ever
  recouping costs, and its posters hotlinked `m.media-amazon.com`. Nothing
  calls it now; `OMDB_API_KEY` can be dropped from prod secrets once the
  backfill has run and the cutover is verified.
- **Google Books / IMDb** - not data sources. IMDb ids are still stored on
  movie rows (TMDB supplies them), but no IMDb data or ratings are used.
  `movies.rating_imdb` is a frozen legacy column, never displayed.

## Constraints to remember

- **TMDB's attribution is enforced, not advisory** - their docs state that
  usage not complying with the terms will have API access revoked. The
  sentence must appear verbatim and the logo unmodified (no recolor, no
  crop). Re-check `/about` renders both after any redesign.
- **TVmaze is ShareAlike** - TV-derived data we republish (e.g., exports)
  carries CC BY-SA; the export feature should note this.
- **Watch-provider data is JustWatch's, not TMDB's.** TMDB's
  `/watch/providers` requires attributing **JustWatch** as the source
  wherever availability is shown - a separate obligation from the TMDB
  sentence above. See druthers-web#26.
- **Monetization** is no longer blocked by the movie source. The remaining
  non-commercial caveat on `/about` ("druthers is a personal, non-commercial
  project") is a statement of current fact, not a licensing requirement -
  revisit it if that changes.
