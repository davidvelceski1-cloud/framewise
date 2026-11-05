import covers from "./covers.json";

/**
 * Cover art map produced by `npm run covers:sync` (IGDB). Only IGDB image IDs are stored —
 * images are served from IGDB's CDN, never bundled. Entries with `manual: true` are
 * hand-set and never overwritten by the sync.
 */
export interface CoverEntry {
  imageId?: string;
  url?: string; // explicit URL or local /covers/… path
  igdbId?: number;
  igdbName?: string;
  manual?: boolean;
}

const map = covers as Record<string, CoverEntry>;

export const igdbCoverUrl = (imageId: string, size: "t_cover_big" | "t_cover_big_2x" = "t_cover_big_2x") =>
  `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;

export function coverUrlFor(slug: string): string | undefined {
  const e = map[slug];
  if (!e) return undefined;
  if (e.url) return e.url;
  return e.imageId ? igdbCoverUrl(e.imageId) : undefined;
}

export const coverCount = () => Object.values(map).filter((e) => e.url || e.imageId).length;
