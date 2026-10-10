# Fresh Mart — GraphRAG e-commerce search demo

A standalone storefront with a single search bar, built against the
`backend`'s hybrid graph search (vector search + a live Neo4j traversal) and
the "Grocery Store Catalog" seed graph from the main app.

On load, it looks up that graph's id by name via `GET /graphs`, then sends
every search to `POST /graphs/{id}/search` and renders the matched products
as cards (price, dietary-flag badges, allergens, category/brand).

## Color theme

The palette (`src/index.css`) is generated with the golden-ratio method from
[eagleworks.co.uk/colourtool](https://eagleworks.co.uk/colourtool/): pick a
base hue (150°, a fresh green), then rotate by the golden angle
(360° − 360°/1.618 ≈ 137.5°) to get the accent hue (287.5°, violet). Each hue
gets a "full" and a "muted" (−60% saturation) swatch; the rest of the
Tailwind scale (50/100/300/500/700) extends those two hues across lightness
for normal UI use.

## Running it

This app expects the main stack's backend (and a seeded "Grocery Store
Catalog" graph — seeded automatically on first run against an empty
database) to be reachable. Easiest via the repo-root `docker compose up`,
which brings this up alongside everything else at http://localhost:3001.

Standalone, for local dev against an already-running backend:

```bash
npm install
VITE_DEV_API_PROXY_TARGET=http://localhost:8000 npm run dev
```

If the catalog has no embeddings yet, "Generate embeddings" needs to be run
once from the main `frontend-chats` graph editor (or via the backend's
`/graphs/{id}/embeddings` endpoint) before search returns results.

## Scripts

```bash
npm run dev     # Vite dev server
npm run build   # Type-check + production build
npm run test    # Vitest unit tests
npm run lint    # oxlint
```
