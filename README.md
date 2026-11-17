# Flag Guesser

## Running the App

Install dependencies:

```
npm install
```

Start the development server:

```
npm run dev
```

Build for production:

```
npm run build
```

Preview the production build:

```
npm run preview
```

## Flags

The SVGs in `static/countries/svg` come from [flag-icons](https://github.com/lipis/flag-icons) (4:3
set), except where that set is simplified or wrong. Those were replaced with accurate versions from
[hampusborgos/country-flags](https://github.com/hampusborgos/country-flags) (sourced from Wikimedia
Commons): `ec`, `md`, `af`, `mp`, `sm`, `mt`, `ml`, `gn`, and `sh-ta` from
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flag_of_Tristan_da_Cunha.svg).

Entries whose flag is identical to their parent country's (e.g. Svalbard, Diego Garcia) are left out.

## Generating PNGs

`generate_pngs.py` renders every country in `countries.json` to `static/countries/png` at 4:3
(default 683×512). Flags that aren't 4:3 are extended rather than stretched: their plain-coloured
edges are repeated outward, so emblems keep their proportions. Flags whose edges aren't plain
(diagonals, triangles at the hoist) can't be extended cleanly, so use a 4:3 SVG for those.

```
uv run generate_pngs.py
```

To use a custom height run with optional height parameter:

```
uv run generate_pngs.py 1000
```

CairoSVG needs the Cairo library (`brew install cairo`). On Apple Silicon, if it can't find it, run with
`DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uv run generate_pngs.py`.
