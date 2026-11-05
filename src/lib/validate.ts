import "server-only";
import { platformById } from "./platforms";
import type { Game, Mode, PcRequirements, PerformanceTest } from "./types";

const MODES: Mode[] = ["performance", "balanced", "quality", "raytracing"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ValidationError extends Error {}
const fail = (m: string): never => {
  throw new ValidationError(m);
};
const str = (v: unknown, name: string, max = 2000) => (typeof v === "string" && v.length <= max ? v : fail(`${name} must be a string (≤${max} chars)`));
const num = (v: unknown, name: string, min = 0, max = 1e6) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : fail(`${name} must be a number between ${min} and ${max}`));

/** Admin edits replace whole objects; we check the fields the UI depends on. */
export function validateGame(g: unknown): Game {
  const x = g as Game;
  if (!x || typeof x !== "object") fail("game required");
  if (!SLUG.test(str(x.slug, "slug", 120))) fail("slug must be kebab-case");
  str(x.title, "title", 200);
  str(x.tagline ?? "", "tagline", 300);
  str(x.summary ?? "", "summary", 3000);
  if (!DATE.test(str(x.releaseDate, "releaseDate", 10))) fail("releaseDate must be YYYY-MM-DD");
  str(x.engine, "engine", 120);
  for (const k of ["genres", "tags", "developers", "publishers", "releases", "patches", "benchmarked"] as const) if (!Array.isArray(x[k])) fail(`${k} must be an array`);
  if (!x.profile || typeof x.profile !== "object") fail("profile required");
  if (!Array.isArray(x.cover) || x.cover.length !== 3) fail("cover needs 3 colors");
  if (x.coverUrl !== undefined && x.coverUrl !== "") {
    str(x.coverUrl, "coverUrl", 500);
    if (!/^https:\/\/[^\s"<>]+$/.test(x.coverUrl) && !/^\/covers\/[\w.-]+\.(?:jpe?g|png|webp|avif)$/.test(x.coverUrl)) fail("coverUrl must be an https URL or a /covers/<file> path");
  } else delete x.coverUrl;
  return x;
}

export function validateTest(t: unknown): PerformanceTest {
  const x = t as PerformanceTest;
  if (!x || typeof x !== "object") fail("test required");
  if (!SLUG.test(str(x.gameSlug, "gameSlug", 120))) fail("gameSlug invalid");
  if (!(x.platform in platformById)) fail("unknown platform");
  if (!MODES.includes(x.mode)) fail("unknown mode");
  num(x.fpsAvg, "fpsAvg", 1, 1000);
  num(x.fps1Low, "fps1Low", 0, 1000);
  if (x.fps1Low > x.fpsAvg) fail("1% low cannot exceed average");
  if (x.targetFps !== null) num(x.targetFps, "targetFps", 1, 1000);
  num(x.nativePixels, "nativePixels", 144, 4320);
  num(x.loadSec, "loadSec", 0, 600);
  num(x.installGB, "installGB", 0, 1000);
  for (const k of ["nativeRes", "outputRes", "upscaler", "patchVersion"] as const) str(x[k], k, 120);
  if (!["Low", "Medium", "High", "Ultra"].includes(x.quality)) fail("quality invalid");
  if (!x.source || typeof x.source.label !== "string") fail("source label required");
  if (x.source.url && !/^https:\/\//.test(x.source.url)) fail("source url must be https");
  return { ...x, rayTracing: !!x.rayTracing, hdr: !!x.hdr, vrr: !!x.vrr, verified: !!x.verified, demo: !!x.demo };
}

export function validateRequirements(r: unknown): PcRequirements {
  const x = r as PcRequirements;
  if (!x || typeof x !== "object" || !SLUG.test(x.gameSlug)) fail("gameSlug invalid");
  for (const tier of [x.minimum, x.recommended, ...(x.ultra ? [x.ultra] : [])]) {
    if (!tier) fail("minimum and recommended tiers required");
    for (const k of ["cpu", "gpu", "storage", "os", "api", "target"] as const) str(tier[k], k, 200);
    num(tier.ram, "ram", 1, 512);
    num(tier.vram, "vram", 0, 128);
  }
  if (!x.refs) fail("refs required");
  str(x.source, "source", 300);
  return x;
}

/** Optional shared-secret guard for admin routes (set ADMIN_TOKEN in production). */
export function adminAllowed(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-admin-token") === token;
}
