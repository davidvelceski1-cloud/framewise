export type PlatformFamily = "playstation" | "xbox" | "nintendo" | "pc" | "steamdeck";

export type PlatformId =
  | "ps5"
  | "ps5-pro"
  | "xbox-series-x"
  | "xbox-series-s"
  | "switch"
  | "switch-2"
  | "steam-deck"
  | "pc-mid"
  | "pc-high";

/** Platforms a game can be *released* on (superset of benchmarked platforms). */
export type ReleasePlatform =
  | "ps4"
  | "ps5"
  | "xbox-one"
  | "xbox-series"
  | "switch"
  | "switch-2"
  | "pc"
  | "mac";

export type Mode = "performance" | "balanced" | "quality" | "raytracing";

export interface Studio {
  slug: string;
  name: string;
  kind: "studio" | "publisher" | "both";
  founded?: number;
  hq?: string;
  parent?: string;
  history: string;
  monogram: string;
  colors: [string, string];
}

export interface Credits {
  director?: string;
  leadWriter?: string;
  composer?: string;
  producer?: string;
}

export interface GameRelease {
  platform: ReleasePlatform;
  date: string; // ISO
  edition?: string; // e.g. "Xbox Series X|S Optimized"
}

export interface Patch {
  version: string;
  date: string;
  notes: string;
}

export interface PerfProfile {
  /** GPU heaviness relative to a typical current-gen title (1 = PS5 hits 60fps ≈1296p). */
  load: number;
  modes: Mode[];
  fpsCap?: number;
  caps?: Partial<Record<PlatformId, number>>;
  /** max output height per platform, e.g. last-gen builds running via backward compatibility */
  maxHeight?: Partial<Record<PlatformId, number>>;
  rt: boolean; // supports ray tracing on PC
  /** "mode" = dedicated RT mode on consoles, "always" = RT in every console mode */
  rtConsole: false | "mode" | "always";
  consoleUpscaler: string;
  pcUpscaler: string;
  proEnhanced: boolean;
  switch2Dlss?: boolean;
  loadBase: number; // seconds on PS5
  patch: string;
  deck?: "verified" | "playable" | "unsupported";
}

export interface Game {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  releaseDate: string;
  genres: string[];
  tags: string[];
  criticScore?: number;
  developers: string[]; // studio slugs
  publishers: string[];
  credits: Credits;
  engine: string;
  releases: GameRelease[];
  installGB: Partial<Record<PlatformFamily, number>>;
  cover: [string, string, string]; // gradient stops for generated key art
  /** real cover art: an IGDB CDN URL (from the cover sync) or a local /covers/… file; falls back to generated art */
  coverUrl?: string;
  patches: Patch[];
  profile: PerfProfile;
  /** platforms with performance entries */
  benchmarked: PlatformId[];
}

export interface ReqTier {
  cpu: string;
  gpu: string;
  ram: number;
  vram: number;
  storage: string;
  os: string;
  api: string;
  target: string; // e.g. "1080p · Low · 30fps"
}

export interface PcRequirements {
  gameSlug: string;
  minimum: ReqTier;
  recommended: ReqTier;
  ultra?: ReqTier;
  /** reference GPU/CPU keys in the hardware table used by the "Can I run it" estimator */
  refs: { minGpu: string; recGpu: string; minCpu: string; recCpu: string };
  source: string;
}

export interface PerformanceTest {
  id: string;
  gameSlug: string;
  platform: PlatformId;
  mode: Mode;
  targetFps: number | null; // null = uncapped
  fpsAvg: number;
  fps1Low: number;
  nativeRes: string; // e.g. "1440p (dynamic 1224p–1440p)"
  nativePixels: number; // height in px, used for scoring
  outputRes: string;
  upscaler: string;
  quality: "Low" | "Medium" | "High" | "Ultra";
  rayTracing: boolean;
  rtNote?: string;
  hdr: boolean;
  vrr: boolean;
  loadSec: number;
  installGB: number;
  patchVersion: string;
  source: { label: string; url?: string };
  verified: boolean;
  demo: boolean;
  testedAt: string;
}

export interface Submission {
  id: string;
  createdAt: string;
  submittedBy: string;
  status: "pending" | "approved" | "rejected";
  test: Omit<PerformanceTest, "id" | "verified" | "demo">;
}

export interface Catalog {
  games: Game[];
  studios: Studio[];
  requirements: PcRequirements[];
  tests: PerformanceTest[];
}
