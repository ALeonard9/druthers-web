# Data-source attribution & licensing

What each provider requires, what we display, and where. The user-facing
notices live on **`/about`** ("The data on the shelves"). Verified against
each provider's site 2026-07-18 (aleonard.us-web#14).

| Provider | Used for | License / requirement (verified) | How we satisfy it |
|---|---|---|---|
| **OMDb API** (omdbapi.com) | Movie search, detail, posters (`movie_search.py`) | All content **CC BY-NC 4.0** — attribution + **non-commercial use only** | Credit + link + license link on /about. druthers is personal/non-commercial. |
| **TVmaze** (tvmaze.com/api) | TV shows, episodes, air dates (`tv_search.py`) | **CC BY-SA 4.0**: "TVmaze is properly credited as source"; attribution satisfied "by linking back to TVmaze" | Credit + link + license link on /about; TV search page names TVMaze. |
| **Open Library** (openlibrary.org) | Book search, records, covers (`book_search.py`) | No hard attribution mandate found; courtesy credit expected (Internet Archive project) | Credit + link on /about; Books search page names Open Library. |
| **IGDB** (igdb.com, via Twitch OAuth) | Game search, detail, covers (`game_search.py`) | Terms page (api-docs.igdb.com) returned 403 during verification — standard practice per their developer docs is credit + link | Credit + link on /about. **Re-verify terms when the docs are reachable.** |

## Deliberately absent

- **TMDB** — a `TMDB_API_KEY` setting exists in the API config but nothing
  calls TMDB; no attribution shown (their required wording + logo applies
  only "every application that uses our data or images"). If TMDB is ever
  wired in: display *"This product uses the TMDB API but is not endorsed or
  certified by TMDB."* plus an unmodified logo from
  themoviedb.org/about/logos-attribution.
- **Google Books / IMDb** — not data sources. (OMDb states it is "not
  endorsed by or affiliated with IMDb.com"; neither are we.)

## Constraints to remember

- **OMDb is CC BY-NC** — if druthers ever monetizes (ads, subscriptions),
  movie data must move to a commercially licensed source (e.g., paid OMDb
  or TMDB with their attribution) first.
- **TVmaze is ShareAlike** — TV-derived data we republish (e.g., exports)
  carries CC BY-SA; the export feature should note this.
