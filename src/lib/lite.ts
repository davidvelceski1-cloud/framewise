import type { Catalog, Game, PerformanceTest, Studio } from "./types";

/**
 * Slim projections of the catalog for client components. With 200+ games and 2,000+
 * benchmark rows, shipping the full catalog to every page would bloat the payload.
 */
export type BrowseGame = Pick<Game, "slug" | "title" | "cover" | "coverUrl" | "releaseDate" | "genres" | "tags" | "engine" | "publishers" | "criticScore">;
export type LiteTest = Pick<PerformanceTest, "gameSlug" | "platform" | "mode" | "fpsAvg">;
export interface BrowseData {
  games: BrowseGame[];
  tests: LiteTest[];
  publishers: Pick<Studio, "slug" | "name">[];
}

export function browseData(cat: Catalog): BrowseData {
  const pubSlugs = new Set(cat.games.flatMap((g) => g.publishers));
  return {
    games: cat.games.map(({ slug, title, cover, coverUrl, releaseDate, genres, tags, engine, publishers, criticScore }) => ({ slug, title, cover, coverUrl, releaseDate, genres, tags, engine, publishers, criticScore })),
    tests: cat.tests.map(({ gameSlug, platform, mode, fpsAvg }) => ({ gameSlug, platform, mode, fpsAvg })),
    publishers: cat.studios.filter((s) => pubSlugs.has(s.slug)).map(({ slug, name }) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type RunGame = Pick<Game, "slug" | "title" | "cover" | "coverUrl">;
export const runGames = (cat: Catalog): RunGame[] => cat.games.map(({ slug, title, cover, coverUrl }) => ({ slug, title, cover, coverUrl }));

export type DashGame = Pick<Game, "slug" | "title" | "cover" | "coverUrl" | "installGB"> & { patch: string };
export type DashTest = Pick<PerformanceTest, "id" | "gameSlug" | "platform" | "mode" | "fpsAvg" | "nativePixels" | "nativeRes">;
export interface DashData {
  games: DashGame[];
  requirements: Catalog["requirements"];
  /** only 60 fps console/handheld entries — used for "runs great on your consoles" */
  consoleTests: DashTest[];
}

export function dashData(cat: Catalog): DashData {
  return {
    games: cat.games.map(({ slug, title, cover, coverUrl, installGB, profile }) => ({ slug, title, cover, coverUrl, installGB, patch: profile.patch })),
    requirements: cat.requirements,
    consoleTests: cat.tests
      .filter((t) => !t.platform.startsWith("pc") && t.fpsAvg >= 58.5)
      .map(({ id, gameSlug, platform, mode, fpsAvg, nativePixels, nativeRes }) => ({ id, gameSlug, platform, mode, fpsAvg, nativePixels, nativeRes })),
  };
}
