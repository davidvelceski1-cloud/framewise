/**
 * Sync cover art from SteamGridDB → src/lib/data/covers.json
 *
 *   npm run covers:sgdb            # fill in games that don't have a cover yet
 *   npm run covers:sgdb -- --force # re-check every game (manual entries are kept)
 *   npm run covers:sgdb -- --dry   # show matches without writing
 *
 * Needs STEAMGRIDDB_API_KEY (free: log in at https://www.steamgriddb.com, then
 * Preferences → API), read from the environment or .env.local.
 * Only image URLs are stored; images stay on SteamGridDB's CDN.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allSeedGames } from "../src/lib/data/all";
import type { CoverEntry } from "../src/lib/data/covers";
import { baseTitle, pickBestBy, queryFor } from "./cover-match";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  /* no .env.local — fall back to the process environment */
}

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const DRY = args.has("--dry");
const OUT = path.join(process.cwd(), "src/lib/data/covers.json");
const API = "https://www.steamgriddb.com/api/v2";
const KEY = process.env.STEAMGRIDDB_API_KEY;

if (!KEY) {
  console.error(
    "Missing STEAMGRIDDB_API_KEY.\n" +
      "Log in at https://www.steamgriddb.com, open Preferences → API, generate a key,\n" +
      "then add STEAMGRIDDB_API_KEY=... to .env.local and run `npm run covers:sgdb` again.",
  );
  process.exit(1);
}

interface SgdbGame {
  id: number;
  name: string;
  release_date?: number; // unix seconds
  verified?: boolean;
}
interface SgdbGrid {
  id: number;
  score: number;
  style: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  nsfw: boolean;
  humor: boolean;
  epilepsy?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get<T>(pathname: string, attempt = 0): Promise<T | null> {
  const res = await fetch(`${API}${pathname}`, { headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" } });
  if (res.status === 429 && attempt < 5) {
    await sleep(1500 * (attempt + 1));
    return get(pathname, attempt + 1);
  }
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error("SteamGridDB rejected the API key (401). Check STEAMGRIDDB_API_KEY.");
  if (!res.ok) throw new Error(`SteamGridDB ${pathname} failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { success: boolean; data: T };
  return json.success ? json.data : null;
}

const search = (name: string) => get<SgdbGame[]>(`/search/autocomplete/${encodeURIComponent(name)}`);

/** Portrait box art (600×900, the Steam library capsule size), safe-for-work, static images only. */
async function bestGrid(gameId: number): Promise<SgdbGrid | null> {
  const grids = await get<SgdbGrid[]>(`/grids/game/${gameId}?dimensions=600x900&types=static&nsfw=false&humor=false&epilepsy=false`);
  const ok = (grids ?? []).filter((g) => !g.nsfw && !g.humor && !g.epilepsy);
  ok.sort((a, b) => b.score - a.score);
  return ok[0] ?? null;
}

async function main() {
  const existing = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, CoverEntry>;
  const result: Record<string, CoverEntry> = { ...existing };
  const todo = allSeedGames.filter((g) => !existing[g.slug]?.manual && (FORCE || !(existing[g.slug]?.imageId || existing[g.slug]?.url)));
  console.log(`${allSeedGames.length} games · ${todo.length} to look up${DRY ? " (dry run)" : ""}`);

  const unmatched: string[] = [];
  let matched = 0;
  for (const [i, g] of todo.entries()) {
    const tag = `[${i + 1}/${todo.length}]`;
    const { name } = queryFor(g.title, g.releaseDate);
    let game = pickBestBy(g.title, g.releaseDate, (await search(name)) ?? [], (c) => c.release_date);
    const base = baseTitle(name);
    if (!game && base) game = pickBestBy(base, g.releaseDate, (await search(base)) ?? [], (c) => c.release_date);
    const grid = game ? await bestGrid(game.id) : null;
    if (game && grid) {
      result[g.slug] = { url: grid.url, source: "steamgriddb", sgdbGameId: game.id, sgdbName: game.name };
      matched++;
      console.log(`  ✓ ${tag} ${g.title} → ${game.name}`);
    } else {
      unmatched.push(`${g.slug}  (${g.title})${game ? " — game found, no 600×900 grid" : ""}`);
      console.log(`  · ${tag} ${g.title} → ${game ? "no portrait grid" : "no confident match"}`);
    }
    await sleep(250);
  }

  if (!DRY) {
    const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  }
  console.log(`\nMatched ${matched}/${todo.length}.${DRY ? "" : ` Wrote ${path.relative(process.cwd(), OUT)}.`}`);
  if (unmatched.length) {
    console.log(
      `\nNot matched (left on generated art). To set one by hand, pick a grid on steamgriddb.com and add to covers.json:\n` +
        `  "slug": { "url": "https://cdn2.steamgriddb.com/grid/....png", "manual": true }\n` +
        unmatched.map((u) => `  - ${u}`).join("\n"),
    );
  }
  console.log("\nRestart the dev server (or rebuild) to show the new covers.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
