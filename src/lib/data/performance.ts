import { platformById } from "../platforms";
import type { Game, Mode, PerformanceTest, PlatformId } from "../types";

/**
 * DEMO DATA GENERATOR
 * Produces plausible, deterministic benchmark rows from each game's PerfProfile
 * and each platform's relative power. Every row is flagged `demo: true` and
 * `verified: false`; the UI labels them as demo data. Replace with real
 * measurements via the admin panel or community submissions.
 */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const K = 52; // PS5, load 1.0, 1440p internal → ~52 fps
const EXP = 1.3;
const STEPS = [360, 432, 540, 576, 626, 720, 800, 864, 900, 1008, 1080, 1152, 1224, 1296, 1440, 1584, 1620, 1728, 1800, 1890, 2016, 2160];

const snap = (h: number) => STEPS.reduce((best, s) => (Math.abs(s - h) < Math.abs(best - h) ? s : best), STEPS[0]);
const fpsAt = (power: number, load: number, h: number, settings = 1) => K * (power / load) * Math.pow(1440 / h, EXP) * settings;
const heightFor = (power: number, load: number, target: number, settings = 1) =>
  1440 / Math.pow(target / (K * (power / load) * settings), 1 / EXP);
const r1 = (n: number) => Math.round(n * 10) / 10;

const CONSOLES: PlatformId[] = ["ps5", "ps5-pro", "xbox-series-x", "xbox-series-s"];
const MIN_H: Partial<Record<PlatformId, number>> = { switch: 360, "switch-2": 540, "steam-deck": 432, "xbox-series-s": 540 };
const LOAD_FACTOR: Record<PlatformId, number> = {
  ps5: 1, "ps5-pro": 0.95, "xbox-series-x": 1.15, "xbox-series-s": 1.3, switch: 3.2, "switch-2": 1.8,
  "steam-deck": 1.6, "pc-mid": 0.9, "pc-high": 0.7,
};
const SETTINGS: Record<Mode, number> = { performance: 1, balanced: 0.95, quality: 0.9, raytracing: 0.6 };

function tier(ratio: number): PerformanceTest["quality"] {
  if (ratio >= 2) return "Ultra";
  if (ratio >= 0.8) return "High";
  if (ratio >= 0.3) return "Medium";
  return "Low";
}

function modesFor(game: Game, p: PlatformId): Mode[] {
  const pr = game.profile;
  if (CONSOLES.includes(p)) {
    let m = [...pr.modes];
    if (pr.rtConsole === "mode" && !m.includes("raytracing")) m.push("raytracing");
    if (p === "xbox-series-s") m = m.filter((x) => x !== "raytracing" && x !== "balanced");
    return m;
  }
  if (p === "switch") return [pr.modes.includes("quality") ? "quality" : pr.modes[0]];
  if (p === "switch-2") return pr.modes.filter((m) => m === "performance" || m === "quality").slice(0, 2).length
    ? pr.modes.filter((m) => m === "performance" || m === "quality")
    : [pr.modes[0]];
  if (p === "steam-deck") return ["balanced"];
  // PC
  const m: Mode[] = ["performance", "quality"];
  if (pr.rt && pr.rtConsole !== "always") m.push("raytracing");
  return m;
}

function buildTest(game: Game, p: PlatformId, mode: Mode): PerformanceTest {
  const pr = game.profile;
  const plat = platformById[p];
  const rand = rng(`${game.slug}:${p}:${mode}`);
  const isPc = plat.family === "pc";
  const isConsole = !isPc && p !== "steam-deck";
  const settings = isPc ? { performance: 0.8, balanced: 0.75, quality: 0.65, raytracing: 0.45 }[mode] : SETTINGS[mode];

  let out = plat.outputHeight;
  if (p === "switch-2") out = mode === "quality" ? 1440 : 1080;
  if (pr.maxHeight?.[p]) out = Math.min(out, pr.maxHeight[p]!);
  const minH = MIN_H[p] ?? 720;

  let target: number | null;
  const cap = pr.caps?.[p];
  if (isPc) target = cap ?? null;
  else if (p === "steam-deck") target = null; // decided below
  else if (cap) target = cap;
  else if (mode === "performance") target = pr.fpsCap ?? 60;
  else if (mode === "balanced") target = 40;
  else if (mode === "raytracing") target = 30;
  else target = pr.fpsCap ?? 30;

  let h: number;
  let upscaler: string;
  let fps: number;

  if (isPc) {
    const hasUpscaler = !/none|native|—/i.test(pr.pcUpscaler);
    const factor = mode === "performance" ? 2 / 3 : mode === "raytracing" ? (p === "pc-high" ? 0.5 : 0.58) : 1;
    h = hasUpscaler ? out * factor : out;
    const preset = mode === "performance" ? "Quality" : mode === "raytracing" ? (p === "pc-high" ? "Performance" : "Balanced") : "";
    upscaler = hasUpscaler && factor < 1 ? `${pr.pcUpscaler} ${preset}`.trim() : hasUpscaler ? "Native (DLAA/TAA)" : pr.pcUpscaler;
    fps = Math.min(fpsAt(plat.power, pr.load, h, settings), p === "pc-mid" ? 165 : 240);
    if (target) fps = Math.min(fps, target);
  } else if (p === "steam-deck") {
    const at800 = fpsAt(plat.power, pr.load, 800, 1);
    target = pr.caps?.[p] ?? (at800 >= 62 ? 60 : at800 >= 42 ? 40 : 30);
    h = Math.max(minH, Math.min(out, heightFor(plat.power, pr.load, target)));
    fps = Math.min(target, fpsAt(plat.power, pr.load, h));
    upscaler = h < out - 20 ? "FSR 2 (in-game)" : "Native";
  } else {
    const t = target ?? 30;
    const ideal = heightFor(plat.power, pr.load, t, settings);
    if (pr.fpsCap && mode === "quality" && !cap) {
      // capped games: quality mode trades frame-rate stability for ~35% more resolution
      h = Math.min(out, heightFor(plat.power, pr.load, t, settings) * 1.35);
    } else {
      h = Math.min(out, ideal);
    }
    h = Math.max(minH, h);
    fps = Math.min(t, fpsAt(plat.power, pr.load, h, settings));
    if (p === "ps5-pro" && pr.proEnhanced) upscaler = "PSSR";
    else if (p === "switch-2") upscaler = pr.switch2Dlss ? "DLSS" : "Dynamic resolution";
    else if (p === "switch") upscaler = "Dynamic resolution";
    else upscaler = pr.consoleUpscaler;
    if (h >= out - 10 && /native|none/i.test(upscaler) === false && upscaler !== "PSSR")
      upscaler = upscaler === "Dynamic resolution" ? "Native" : `${upscaler} (native res)`;
  }

  const hit = target !== null && fps >= target - 0.01;
  const avg = hit ? target! - rand() * (target! >= 60 ? 1.6 : 0.6) : fps * (0.97 + rand() * 0.03);
  const low = avg * (hit ? 0.83 + rand() * 0.1 : 0.7 + rand() * 0.1);
  const snapped = snap(h);
  const dynamic = isConsole || p === "steam-deck";
  const native = dynamic && snapped < out ? `${snapped}p (dynamic)` : `${snapped}p`;
  const outLabel = p === "steam-deck" ? "800p (1280×800)" : `${out}p`;

  const ratio = (plat.power / pr.load) * (isPc ? 1.2 : 1);
  let quality = tier(ratio);
  if (isPc) quality = mode === "performance" ? "High" : "Ultra";
  else if (mode === "quality" || mode === "raytracing") quality = quality === "Low" ? "Medium" : quality === "Medium" ? "High" : "High";

  const rtAll = pr.rtConsole === "always";
  const rayTracing = mode === "raytracing" || (rtAll && (isConsole || isPc));
  const rtNote = mode === "raytracing" ? "RT reflections / shadows" : rtAll ? "RT always on" : undefined;

  const fam = plat.family;
  const install = game.installGB[fam] ?? game.installGB.pc ?? 50;

  return {
    id: `${game.slug}__${p}__${mode}`,
    gameSlug: game.slug,
    platform: p,
    mode,
    targetFps: target,
    fpsAvg: r1(avg),
    fps1Low: r1(low),
    nativeRes: native,
    nativePixels: snapped,
    outputRes: outLabel,
    upscaler,
    quality,
    rayTracing,
    rtNote,
    hdr: !["switch", "steam-deck"].includes(p),
    vrr: isPc || CONSOLES.includes(p),
    loadSec: r1(pr.loadBase * LOAD_FACTOR[p] * (0.92 + rand() * 0.16)),
    installGB: install,
    patchVersion: pr.patch,
    source: { label: "FRAMEWISE demo seed" },
    verified: false,
    demo: true,
    testedAt: "2025-10-01",
  };
}

export function generateTests(games: Game[]): PerformanceTest[] {
  const out: PerformanceTest[] = [];
  for (const g of games) {
    for (const p of g.benchmarked) {
      for (const m of modesFor(g, p)) out.push(buildTest(g, p, m));
    }
  }
  return out;
}
