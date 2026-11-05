# FRAMEWISE: The Game Performance Atlas

Every game. Every platform. Every frame. FRAMEWISE is a reference for game credits, PC requirements and cross-platform performance (PS5 / PS5 Pro, Xbox Series X|S, Switch / Switch 2, Steam Deck, PC presets). It includes a comparator, a "Can I run it?" estimator and an AI assistant that only answers from its own data.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Framer Motion, Recharts and the Anthropic SDK.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (the admin API is open in dev)
# or
npm run build && ADMIN_TOKEN=change-me npm start
```

### Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Turns on Claude (`claude-opus-5-5`) for the assistant and comparison verdicts. Without it, a built-in offline engine answers from the same retrieved records. |
| `FRAMEWISE_AI=local` | Forces the offline engine even when a key is present. |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Used by `npm run covers:sync` to fetch IGDB cover IDs. |
| `ADMIN_TOKEN` | Required for admin and moderation API routes in production. With no token set, those routes work only under `next dev`. |

## What's where

| Deliverable | Route / file |
|---|---|
| Landing page | `/` (`src/app/page.tsx`) |
| Game detail (Overview · Specs · Performance · Patches · Similar) | `/games/[slug]` |
| Cross-platform comparator (charts, winner, image slider, share/export/save) | `/compare?game=…&p=ps5.performance,…` (`src/components/comparator.tsx`) |
| Platform-themed pages | `/platforms`, `/platforms/[slug]` |
| Studios and publishers | `/studios`, `/studios/[slug]` |
| AI assistant: floating chat, ⌘K palette, full page | `src/components/assistant.tsx`, `command-palette.tsx`, `/assistant` |
| Can I Run It? | `/can-i-run` |
| Auth and user dashboard (builds, consoles, favorites, comparisons, alerts, submissions) | `/login`, `/dashboard` |
| Admin (games and credits, PC specs, performance entries, moderation queue) | `/admin` |
| Browse with filters and natural-language search | `/games?q=open-world games at 30 fps+ on Steam Deck` |

### Design system
- Tokens (Ivory / Pearl / Ink / Graphite / Champagne Gold and the Midnight Edition) live in `src/app/globals.css`. Gold text uses an AA-safe `--gold-ink`. The decorative `#C9A96E` is never used for body text on ivory.
- **`platformTheme`** is in `src/lib/platforms.ts`: brand colors, gradients, AA-safe badge colors, page tints and chart colors per platform. To add Mac, mobile or a future console, add a family and platform entries there.
- Platform names always appear as text; color is never the only signal.

### Data
- `src/lib/data/games.ts`: 18 fully curated games (taglines, summaries, credits, patch notes, approximate critic scores).
- `src/lib/data/games-extended.ts`: 204 more games in a compact one-line format (title, date, genres, tags, studios, engine, per-platform dates, performance flags, director, composer), expanded by `src/lib/data/expand.ts`. That makes **222 games** across 175 studio and publisher profiles. Credits are filled only where known; unknown fields show "—". Studios without a curated profile get a generated page listing their games.
- `src/lib/data/requirements.ts`: minimum, recommended and optional Ultra PC specs for the 18 curated games, seeded from publisher listings. Verify these before production. The extended games get **estimated** specs from release year and engine. They are labeled "Estimated requirements" in the UI and "estimated (unofficial)" in assistant answers.
- `src/lib/data/performance.ts`: **demo benchmark generator.** It derives ~2,100 plausible, deterministic entries from each game's profile and each platform's relative power. Every row is flagged `demo: true` and labeled **Demo data** in the UI. These are not real measurements.
- `src/lib/data/hardware.ts`: GPU/CPU performance index used by the estimator. Estimates always carry a confidence level.
- `src/lib/db.ts`: merges seed data with `.data/store.json` (admin edits and approved submissions). Reads are cached with `"use cache"` under the `catalog` tag, and admin routes expire that tag. Delete `.data/` to reset.

### Payload size
With 2,000+ benchmark rows, client pages receive slim projections (`src/lib/lite.ts`). The comparator loads a single game's rows from `GET /api/tests?game=…`, and long lists page with "Show more".

### AI
- `src/lib/analysis.ts` holds retrieval (game, GPU, CPU, platform and resolution detection), the scoring and winner logic, the verdict writer, the estimator and the natural-language search parser.
- `POST /api/assistant` streams the answer. With a key, Claude receives only the retrieved, citation-tagged records and is instructed to cite every figure and refuse to invent benchmarks. Server-side refusal fallbacks are enabled (`fallbacks: "default"`). Without a key, or if the request fails, the offline engine answers.
- `POST /api/summary` produces the 3–4 sentence comparison verdict.

## Cover art (IGDB)
Real box art comes from [IGDB](https://www.igdb.com). Only IGDB **image IDs** are stored in the repo; the images load from IGDB's CDN with attribution in the footer. Games without a cover keep the generated art, and any image that fails to load falls back to it automatically.

1. Create a free app at <https://dev.twitch.tv/console> (Register Your Application, OAuth redirect `http://localhost`, category "Website Integration").
2. Copy `.env.example` to `.env.local` and fill in `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.
3. Run `npm run covers:sync`. It looks up every game and writes `src/lib/data/covers.json` (about 1–2 minutes at IGDB's rate limit). Use `-- --force` to re-check everything or `-- --dry` to preview.
4. Rebuild (`npm run build`) or restart `npm run dev`.

The sync only accepts confident matches (exact title, or a close title with the same release year). It lists any it skipped. To fix one, add a manual entry in `covers.json`. The sync never overwrites these:
```json
"god-of-war-2018": { "imageId": "<igdb image id>", "manual": true },
"some-game": { "url": "/covers/some-game.jpg", "manual": true }
```
Local files go in `public/covers/`, so only use images you have the rights to. Admins can also set a cover per game in the admin panel (Cover image URL).

## Going to production
1. **Database**: `supabase/schema.sql` covers the full data model, including RLS. Point `getCatalog()` and the admin routes at it.
2. **Auth**: the current sign-in is **demo-only**. Accounts live in browser `localStorage` and "Continue with Google" is simulated. Replace it with Supabase Auth (email + Google OAuth), and move user data (builds, favorites, comparisons, alerts) to the user tables.
3. **Metadata sync**: covers already sync from IGDB (see above). Extend the same script to pull credits and platforms.
4. **Real benchmarks**: replace demo rows through the moderation queue or admin panel, each with a source link and verification status.
5. **Patch alerts**: these are stored per user. Delivery needs a scheduled job that compares patch versions and sends email.
