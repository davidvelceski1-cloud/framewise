import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { allRequirements as requirements, allSeedGames as seedGames, studioNames } from "./data/all";
import { studios as curatedStudios } from "./data/studios";
import { mergeStudios } from "./data/expand";
import { generateTests } from "./data/performance";
import type { Catalog, Game, PcRequirements, PerformanceTest, Submission } from "./types";

/**
 * Lightweight persistence for the demo: seed data + a JSON file of admin edits
 * and community submissions. Swap for Supabase/Postgres using supabase/schema.sql.
 */
export interface Store {
  gameEdits: Record<string, Game>; // full replacement or new game, keyed by slug
  deletedGames: string[];
  testEdits: Record<string, PerformanceTest>; // keyed by test id (new or replaced)
  reqEdits: Record<string, PcRequirements>; // keyed by game slug
  deletedTests: string[];
  submissions: Submission[];
}

/** Cache tag for everything derived from the catalog; admin routes expire it after edits. */
export const CATALOG_TAG = "catalog";

// Vercel and other serverless hosts have a read-only filesystem except /tmp, which is per-instance
// and ephemeral. Set FRAMEWISE_STORE_PATH, or move to Supabase (supabase/schema.sql), for durable storage.
const STORE_PATH =
  process.env.FRAMEWISE_STORE_PATH ??
  (process.env.VERCEL ? path.join("/tmp", "framewise-store.json") : path.join(process.cwd(), ".data", "store.json"));
const empty = (): Store => ({ gameEdits: {}, deletedGames: [], testEdits: {}, reqEdits: {}, deletedTests: [], submissions: [] });

export async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

const seedTests = generateTests(seedGames);

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("max");
  cacheTag(CATALOG_TAG);
  const store = await readStore();
  const gameMap = new Map(seedGames.map((g) => [g.slug, g]));
  for (const [slug, g] of Object.entries(store.gameEdits)) gameMap.set(slug, g);
  for (const slug of store.deletedGames) gameMap.delete(slug);
  const games = [...gameMap.values()].sort((a, b) => a.title.localeCompare(b.title));
  const live = new Set(games.map((g) => g.slug));

  const testMap = new Map(seedTests.map((t) => [t.id, t]));
  for (const [id, t] of Object.entries(store.testEdits)) testMap.set(id, t);
  for (const id of store.deletedTests) testMap.delete(id);
  const tests = [...testMap.values()].filter((t) => live.has(t.gameSlug));

  const reqMap = new Map(requirements.map((r) => [r.gameSlug, r]));
  for (const [slug, r] of Object.entries(store.reqEdits)) reqMap.set(slug, r);
  const reqs = [...reqMap.values()].filter((r) => live.has(r.gameSlug));

  // studio profiles follow the live game list, so admin-added games get studio pages too
  const studios = mergeStudios(curatedStudios, games, studioNames);
  return { games, studios, requirements: reqs, tests };
}

export async function getGame(slug: string) {
  const cat = await getCatalog();
  const game = cat.games.find((g) => g.slug === slug);
  if (!game) return null;
  return {
    game,
    tests: cat.tests.filter((t) => t.gameSlug === slug),
    requirements: cat.requirements.find((r) => r.gameSlug === slug) ?? null,
    developers: cat.studios.filter((s) => game.developers.includes(s.slug)),
    publishers: cat.studios.filter((s) => game.publishers.includes(s.slug)),
    catalog: cat,
  };
}

/** Compact index passed to client-side search (⌘K, selectors). */
export async function getSearchIndex() {
  const cat = await getCatalog();
  return cat.games.map((g) => ({
    slug: g.slug,
    title: g.title,
    year: g.releaseDate.slice(0, 4),
    cover: g.cover,
    genres: g.genres,
  }));
}
export type SearchIndex = Awaited<ReturnType<typeof getSearchIndex>>;

/** Serialises read-modify-write cycles so concurrent admin requests don't clobber each other. */
let queue: Promise<unknown> = Promise.resolve();
export function mutateStore<T>(fn: (s: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const s = await readStore();
    const out = await fn(s);
    await writeStore(s);
    return out;
  });
  queue = run.catch(() => {});
  return run;
}
