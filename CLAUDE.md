# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm install         # install JS dependencies
npm run dev          # start SvelteKit dev server
npm run build        # production build (static adapter, outputs to build/)
npm run preview      # preview the production build
npm run check        # svelte-kit sync + svelte-check (type checking)
npm run check:watch  # type checking in watch mode
npm run lint         # prettier --check + eslint
npm run format       # prettier --write
```

There is no test suite/script in this project.

Flag PNGs are generated from SVGs via a Python script (uses `uv`, Python >=3.12):

```
uv run generate_pngs.py         # writes static/countries/png/*.png at 512px height
uv run generate_pngs.py 1000    # optional height override
```

## Architecture

SvelteKit 5 (runes mode) app statically adapter-built (`@sveltejs/adapter-static`, `svelte.config.js`) and deployed to GitHub Pages from `main` (`.github/workflows/*.yml`), served under the `/flag-guesser` base path in production. `ssr` is disabled (`src/routes/+layout.ts`) and all routes are prerendered — this is effectively a client-only SPA.

**Game concept**: a Wordle-style daily flag-guessing game. Each guess's flag is pixel-compared against the target flag; matching-color regions are revealed and accumulate ("unioned") across guesses, so the visible silhouette grows with each attempt until the flag is guessed or `MAX_GUESSES` (5) is reached.

**Image comparison core** (`src/lib/getImageIntersect.ts`): loads both flag PNGs via `image-js`, converts pixels to HSL, and considers two pixels a "match" if hue/saturation/lightness are within thresholds (`HUE_THRESHOLD`, `SATURATION_THRESHOLD`, `LIGHTNESS_THRESHOLD`). `getImageIntersect` produces a per-guess match mask + percentage score; `getImageUnion` merges a new intersect result on top of the previous accumulated result (transparent pixels in the new image fall back to the old one), so revealed regions never disappear on subsequent guesses.

**State layer** (`src/lib/state.svelte.ts`): plain functions returning Svelte 5 rune-based state objects (no stores), each exposing only getters plus explicit mutator methods — e.g. `createCountriesState`, `createGuessesState`, `createTargetCountryState`, `createUserSettings`. All persistence is `localStorage`-backed (guarded by `typeof window === 'undefined'` for SSR/build safety) under keys in `STORAGE_KEYS`: user settings, cumulative game stats (streaks, guess distribution), and the current daily game's guesses/result so a reload resumes the same day's game.

**Daily puzzle selection**: the target country is deterministic per UTC day — `getTodaysFlagIndex` seeds a simple LCG PRNG off the UTC day-count so every player gets the same flag on a given day without a backend. `resetTarget()` (used for "play again") switches to `Math.random()` and clears daily-game status.

**Resuming a day in progress** (`src/lib/utils.ts` `getPreviousGameState`, wired in `src/routes/+page.svelte`): replays a persisted `PersistedGameState` by re-loading each previously-guessed flag image and re-running the intersect/union pipeline, so the accumulated result image is rebuilt rather than stored directly.

**Component flow** (`src/lib/components/`): `Game.svelte` owns the per-guess image loading/comparison and orchestrates child components — `FlagHeader` (target flag + easy-mode toggle), `FlagDisplay` (progressive reveal image + guess overlay animation), `CountrySearch` (fuzzy country search via `fuse.js`, excludes already-guessed countries), `AttemptList`/`CountryListItem` (guess history, hoverable to preview that guess's intersect image), `FlagResultPanel` (win/lose state), `StatsPanel` (stats display, shown only for the daily game once it ends).

**Country/flag assets**: `static/countries/countries.json` (code + name list, fetched at runtime) and `static/countries/{svg,png}/{countryCode}.png` (flag images, PNGs generated from SVGs by `generate_pngs.py`). All asset URLs go through SvelteKit's `asset()`/`$app/paths` helper for correct base-path resolution.
