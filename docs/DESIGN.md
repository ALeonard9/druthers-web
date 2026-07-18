# Druthers — design system & product direction

*(dru·thers: "if I had my druthers" — one's own preferences. A contraction of
"would rathers," which is why the brand mark is an apostrophe: the mark of
what's left out, because ranking is choosing.)*

## What this product is

A window into someone's taste — everything they've watched, read, and played,
ranked. Not a private hoard: the long-term arc is social. The signature future
artifact is the **shareable Top 5 card** (per category, Wordle-grid energy):
a formatted, instantly recognizable post of someone's all-timers, signed
`druthers.io`.

Categories: **Movies, TV, Books, Games.** (Countries/travel was cut when the
product went from personal sandbox to real thing; its routes still exist but
are unlisted.)

## Layout ("Monarch bones")

- **Left sidebar** (desktop): brand, then Home / Movies / TV / Books / Games,
  a divider, then Activity / Draw. Active item: panel background + brass icon.
- **Top bar**: time-of-day greeting, env badge, notification bell (brass
  badge), account. On mobile the greeting yields to the wordmark.
- **Bottom tab bar** (mobile, `md:hidden`): the same items, icon + tiny label.
- **Sections own their views**: Schedule is a tab inside TV; Flags belonged to
  Countries. Views that cross sections (Activity, Draw) live below the
  sidebar divider.
- **Home** is a dashboard: Tonight (airing soon + catch-up count), Draw a
  ticket, per-category ranked/queued counts, recent activity.

## Visual identity — "after-hours archive"

Dark room; the collection's artifacts (posters, covers) provide the color.
Two materials carry the brand:

| Token | Value | Role |
|---|---|---|
| `night` | `#101014` | page ground |
| `panel` | `#17171d` | raised surfaces |
| `line` | `#26262e` | hairlines |
| `paper` | `#f2ead8` | ticket stock — headings, wordmark, highlights |
| `ink` | `#1c1917` | text on paper/brass |
| `brass` | `#c9a86a` (+`-bright`, `-wash`) | actions, rank numerals, active states |

Type: **Fraunces** (display — wordmark, titles, rank numerals, used with
restraint) + **Instrument Sans** (body) + system mono (ticket labels, dates).

Signature elements: brass Fraunces **rank numerals** on shelf-plate chips;
the **paper ticket stub** (Draw page) with perforation and notches.

A warm-paper **light theme + toggle** is planned once the layout settles:
tokens must become semantic CSS variables first (including replacing raw
`text-neutral-*` usages), flipped via `[data-theme]`.

## Mobile plan

1. **Now**: this web app is fully responsive — sidebar hides below `md`,
   bottom tabs appear, touch targets ≥ 44px on interactive rows.
2. **Later**: an Expo/React Native app consumes the same `/v1` API (the BFF
   pattern keeps the JWT server-side on web; mobile holds its own token).
   Design tokens above are the shared source of truth.
3. The shareable Top-5 card ships as an image render (server-generated OG
   image) so it posts identically from web and mobile.

## Naming (decided 2026-07-17)

Brand **Druthers**, domain **druthers.io** (only bare-word domain available
across the entire candidate family; register before it's gone). Rejected
families: trove (all TLDs squatted), night-compounds (metaphor didn't land),
five-words (boxed the product in).
