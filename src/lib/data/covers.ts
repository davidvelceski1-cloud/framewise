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
  /** set by `npm run covers:sgdb` (SteamGridDB); `url` then points at cdn2.steamgriddb.com */
  source?: "igdb" | "steamgriddb";
  sgdbGameId?: number;
  sgdbName?: string;
  /** wide banner and transparent logo, from `npm run covers:sgdb -- --art` */
  hero?: string;
  logo?: string;
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

export const heroUrlFor = (slug: string): string | undefined => map[slug]?.hero;
export const logoUrlFor = (slug: string): string | undefined => map[slug]?.logo;

export const coverCount =() => Object.values(map).filter((e) => e.url || e.imageId).length;

/** Which sources supplied the synced covers, for the footer credit. */
export const coverSources = () => {
  const entries = Object.values(map);
  return {
    igdb: entries.some((e) => e.imageId),
    steamgriddb: entries.some((e) => e.source === "steamgriddb" || Boolean(e.url?.includes("steamgriddb.com"))),
  };
};
