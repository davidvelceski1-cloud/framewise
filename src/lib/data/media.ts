import media from "./media.json";

/**
 * Platform photos and studio logos / leadership, produced by `npm run media:sync`
 * (Wikimedia Commons + Wikidata). Only URLs and credits are stored; images stay on
 * Wikimedia's CDN. Entries with `manual: true` are hand-set and never overwritten.
 */
export interface MediaImage {
  url: string;
  width: number;
  height: number;
  /** "Author · License", shown next to the image */
  credit: string;
  /** Commons file page (license and full attribution) */
  source: string;
  caption?: string;
}

export interface StudioLeader {
  name: string;
  /** job title as published: "CEO", "President", "Studio head", "Managing director"… */
  role: string;
  /** where the name came from: Wikidata's CEO/director statement or the Wikipedia infobox */
  source: "wikidata" | "wikipedia";
  wikidata?: string;
  wikipedia?: string;
  photo?: MediaImage;
}

export interface StudioMedia {
  wikidata: string;
  wikipedia?: string;
  logo?: MediaImage;
  leader?: StudioLeader;
  /** a solo developer: the studio is a person */
  person?: { name: string; photo?: MediaImage };
  manual?: boolean;
}

export interface MediaFile {
  platforms: Record<string, MediaImage & { manual?: boolean }>;
  studios: Record<string, StudioMedia>;
}

const data = media as MediaFile;

export const platformImage = (slug: string): MediaImage | undefined => data.platforms[slug];
export const studioMedia = (slug: string): StudioMedia | undefined => data.studios[slug];
export const leaderRoleLabel = (r: StudioLeader["role"]) => (r === "Head" ? "Studio head" : r);
