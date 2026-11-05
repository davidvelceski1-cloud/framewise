import type { Game, Mode, PcRequirements, PlatformFamily, PlatformId, ReleasePlatform, ReqTier, Studio } from "../types";
import { slugify } from "../utils";
import { EXTENDED_GAMES } from "./games-extended";

/* ───────── studio names → slugs (aliases keep the original 18 games' studio pages) ───────── */
const ALIAS: Record<string, string> = {
  "sony-interactive-entertainment": "sie",
  "bandai-namco-entertainment": "bandai-namco",
  "insomniac-games": "insomniac",
  "remedy-entertainment": "remedy",
  "larian-studios": "larian",
  "warner-bros-games": "wb-games",
};
export const studioSlug = (name: string) => {
  const s = slugify(name.replace(/&/g, "and").replace(/\./g, ""));
  return ALIAS[s] ?? s;
};

const CODE: Record<string, ReleasePlatform> = { ps4: "ps4", ps5: "ps5", xo: "xbox-one", xs: "xbox-series", sw: "switch", sw2: "switch-2", pc: "pc", mac: "mac" };

/* Cover palettes for generated key art (deterministic per title). */
const PALETTES: [string, string, string][] = [
  ["#0B1023", "#C9A96E", "#2A2346"], ["#0E1F1A", "#9FE0C8", "#1D4D3F"], ["#1A0F0A", "#E3B65C", "#7A2E1F"],
  ["#0A0E1F", "#7FB2FF", "#22306B"], ["#1C0B16", "#FF8FB1", "#5A1E3D"], ["#101418", "#B7C4CC", "#3A4A56"],
  ["#14100A", "#F2C14E", "#5A3B1E"], ["#0B1A2A", "#5DE0E6", "#1F4F7A"], ["#170B22", "#C59BFF", "#3E2266"],
  ["#1A1208", "#FF9B54", "#6B2E12"], ["#0C1410", "#B5E48C", "#2D5A27"], ["#1E0E0E", "#FF5E5B", "#4A1414"],
];
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);

function defaultLoad(year: number, engine: string) {
  let l = year <= 2013 ? 0.3 : year <= 2016 ? 0.45 : year <= 2018 ? 0.6 : year <= 2020 ? 0.75 : year <= 2022 ? 0.9 : 1.05;
  if (/unreal engine 5/i.test(engine)) l += 0.25;
  return l;
}

function upscalers(engine: string, year: number, load: number, twoD: boolean) {
  if (twoD) return { console: "Native", pc: "Native" };
  const console = /unreal engine 5/i.test(engine) ? "TSR" : /unreal engine 4/i.test(engine) ? "TAAU" : /re engine/i.test(engine) ? "FSR / interlaced" : year >= 2020 ? "FSR 2" : "Dynamic resolution";
  const pc = year >= 2019 && load >= 0.5 ? "DLSS" : "None (TAA)";
  return { console, pc };
}

/* Estimated PC requirement tiers (clearly labelled as estimates in the UI). */
const t = (cpu: string, gpu: string, ram: number, vram: number, storage: string, api: string, target: string): ReqTier => ({ cpu, gpu, ram, vram, storage, os: "Windows 10/11 64-bit", api, target });
const TIERS: { min: ReqTier; rec: ReqTier; refs: PcRequirements["refs"] }[] = [
  { min: t("Core i5-2500K", "GTX 1050 Ti", 4, 2, "10 GB", "DirectX 11", "1080p · Low · 60 fps"), rec: t("Core i5-4460", "GTX 1060 3GB", 8, 3, "10 GB", "DirectX 11", "1080p · High · 60 fps"), refs: { minGpu: "GTX 1050 Ti", recGpu: "GTX 1060 3GB", minCpu: "Core i5-2500K", recCpu: "Core i5-4460" } },
  { min: t("Core i5-2500K", "GTX 770", 8, 2, "50 GB", "DirectX 11", "1080p · Low · 30 fps"), rec: t("Core i7-4770K", "GTX 1060 6GB", 8, 6, "50 GB", "DirectX 11", "1080p · High · 60 fps"), refs: { minGpu: "GTX 770", recGpu: "GTX 1060 6GB", minCpu: "Core i5-2500K", recCpu: "Core i7-4770K" } },
  { min: t("Core i5-4690", "GTX 970", 8, 4, "70 GB", "DirectX 12", "1080p · Low · 30 fps"), rec: t("Core i7-8700", "GTX 1070", 16, 8, "70 GB SSD", "DirectX 12", "1080p · High · 60 fps"), refs: { minGpu: "GTX 970", recGpu: "GTX 1070", minCpu: "Core i5-4690", recCpu: "Core i7-8700" } },
  { min: t("Core i5-8400", "GTX 1060 6GB", 12, 6, "90 GB SSD", "DirectX 12", "1080p · Low · 30 fps"), rec: t("Ryzen 5 3600", "RTX 2070 Super", 16, 8, "90 GB SSD", "DirectX 12", "1080p · High · 60 fps"), refs: { minGpu: "GTX 1060 6GB", recGpu: "RTX 2070 Super", minCpu: "Core i5-8400", recCpu: "Ryzen 5 3600" } },
  { min: t("Ryzen 5 3600", "GTX 1660 Super", 16, 6, "100 GB SSD", "DirectX 12", "1080p · Low · 30 fps"), rec: t("Ryzen 5 5600X", "RTX 3060 Ti", 16, 8, "100 GB SSD", "DirectX 12", "1080p · High · 60 fps"), refs: { minGpu: "GTX 1660 Super", recGpu: "RTX 3060 Ti", minCpu: "Ryzen 5 3600", recCpu: "Ryzen 5 5600X" } },
  { min: t("Ryzen 5 3600", "RTX 2060", 16, 6, "120 GB SSD", "DirectX 12", "1080p · Low · 30 fps (upscaled)"), rec: t("Ryzen 7 5700X", "RTX 3070", 16, 8, "120 GB SSD", "DirectX 12", "1080p · High · 60 fps (upscaled)"), refs: { minGpu: "RTX 2060", recGpu: "RTX 3070", minCpu: "Ryzen 5 3600", recCpu: "Ryzen 7 5700X" } },
];
export const ESTIMATED_SOURCE = "FRAMEWISE estimate from release year and engine (not the official listing)";

function estimateRequirements(slug: string, load: number, rta: boolean): PcRequirements {
  let i = load < 0.15 ? 0 : load < 0.45 ? 1 : load < 0.7 ? 2 : load < 0.95 ? 3 : load < 1.25 ? 4 : 5;
  if (rta) i = Math.max(i, 5);
  const tier = TIERS[i];
  const min = { ...tier.min }, rec = { ...tier.rec };
  if (rta) {
    min.api = rec.api = "DirectX 12 / Vulkan (RT required)";
  }
  return { gameSlug: slug, minimum: min, recommended: rec, refs: tier.refs, source: ESTIMATED_SOURCE };
}

export function parseExtended(): { games: Game[]; requirements: PcRequirements[] } {
  const games: Game[] = [];
  const requirements: PcRequirements[] = [];
  for (const raw of EXTENDED_GAMES.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const [title, date, genres, tags, devs, pubs, engine, plats, flagStr = "", director = "", composer = ""] = line.split("|");
    const slug = slugify(title.replace(/&/g, "and").replace(/[':.]/g, ""));
    const flags = new Set(flagStr.split(/\s+/).filter(Boolean));
    const year = Number(date.slice(0, 4));
    const twoD = flags.has("2d");
    const loadFlag = [...flags].find((f) => f.startsWith("l="));
    const load = loadFlag ? Number(loadFlag.slice(2)) : twoD ? 0.07 : defaultLoad(year, engine);

    const releases = plats.split(",").map((p) => {
      const [code, d] = p.trim().split("@");
      const platform = CODE[code];
      if (!platform) throw new Error(`Unknown platform code "${code}" in ${title}`);
      return { platform, date: d ?? date };
    });
    const has = (p: ReleasePlatform) => releases.some((r) => r.platform === p);
    const nodeck = flags.has("nodeck") || (flags.has("rta") && load > 1);

    // Benchmarked platforms: native current-gen, plus backward-compatible play on PS5 / Series X|S.
    const bench: PlatformId[] = [];
    if (has("ps5") || has("ps4")) bench.push("ps5");
    if (flags.has("pro") && has("ps5")) bench.push("ps5-pro");
    if (has("xbox-series") || has("xbox-one")) bench.push("xbox-series-x", "xbox-series-s");
    if (has("switch")) bench.push("switch");
    if (has("switch-2")) bench.push("switch-2");
    if (has("pc")) {
      if (!nodeck) bench.push("steam-deck");
      bench.push("pc-mid", "pc-high");
    }

    const cap = flags.has("c30") ? 30 : flags.has("c60") ? 60 : undefined;
    const caps: Partial<Record<PlatformId, number>> = {};
    if (cap) for (const p of bench) caps[p] = cap;
    if (flags.has("cc30")) for (const p of bench) if (!p.startsWith("pc") && p !== "steam-deck") caps[p] = 30;
    if (flags.has("s2_60")) caps["switch-2"] = 60;
    const maxHeight: Partial<Record<PlatformId, number>> = {};
    // last-gen-only releases run via backward compatibility at their original targets
    if (!has("ps5") && has("ps4")) caps.ps5 = caps.ps5 ?? (load > 0.4 ? 30 : 60);
    if (!has("ps5") && has("ps4")) maxHeight.ps5 = 1080;
    if (!has("xbox-series") && has("xbox-one")) maxHeight["xbox-series-x"] = maxHeight["xbox-series-s"] = 1080;
    if (!has("xbox-series") && has("xbox-one")) {
      caps["xbox-series-x"] = caps["xbox-series-x"] ?? (load > 0.4 ? 30 : 60);
      caps["xbox-series-s"] = caps["xbox-series-s"] ?? (load > 0.4 ? 30 : 60);
    }

    const modes: Mode[] = load <= 0.45 || cap ? ["performance"] : ["performance", "quality"];
    if (flags.has("bal")) modes.splice(1, 0, "balanced");
    const up = upscalers(engine, year, load, twoD);
    const family = (p: PlatformFamily, base: number) => Math.round(base * (p === "nintendo" ? 0.5 : 1));
    const size = twoD ? 6 : Math.round(15 + load * 70);

    const game: Game = {
      slug,
      title,
      tagline: `${genres.split(",")[0]} from ${devs.split(";")[0]}.`,
      summary: `${title} is a ${year} ${genres.split(",").join(" / ").toLowerCase()} game developed by ${devs.split(";").join(" and ")} and published by ${pubs.split(";").join(" and ")}, running on ${engine === "—" ? "an engine not yet in our database" : engine}.`,
      releaseDate: date,
      genres: genres.split(","),
      tags: tags.split(",").filter(Boolean),
      developers: devs.split(";").map(studioSlug),
      publishers: pubs.split(";").map(studioSlug),
      credits: { ...(director ? { director } : {}), ...(composer ? { composer } : {}) },
      engine,
      releases,
      installGB: { playstation: family("playstation", size), xbox: family("xbox", size), pc: size, nintendo: family("nintendo", size), steamdeck: size },
      cover: PALETTES[hash(title) % PALETTES.length],
      patches: [{ version: "1.0", date, notes: "Launch version. Patch history for this title hasn't been added yet." }],
      benchmarked: bench,
      profile: {
        load,
        modes,
        fpsCap: cap,
        caps,
        maxHeight,
        rt: flags.has("rt") || flags.has("rtm") || flags.has("rta"),
        rtConsole: flags.has("rta") ? "always" : flags.has("rtm") ? "mode" : false,
        consoleUpscaler: up.console,
        pcUpscaler: up.pc,
        proEnhanced: flags.has("pro"),
        switch2Dlss: flags.has("dlss2"),
        loadBase: twoD ? 3 : Math.round(6 + load * 8),
        patch: "1.0",
        deck: has("pc") ? (nodeck ? "unsupported" : load < 0.8 ? "verified" : "playable") : "unsupported",
      },
    };
    games.push(game);
    if (has("pc")) requirements.push(estimateRequirements(slug, load, flags.has("rta")));
  }
  return { games, requirements };
}

/* ───────── studios: curated profiles + generated ones for every other name ───────── */
export function mergeStudios(curated: Studio[], games: Game[], names: Map<string, string>): Studio[] {
  const out = new Map(curated.map((s) => [s.slug, s]));
  const roles = new Map<string, Set<"studio" | "publisher">>();
  for (const g of games) {
    for (const d of g.developers) (roles.get(d) ?? roles.set(d, new Set()).get(d)!).add("studio");
    for (const p of g.publishers) (roles.get(p) ?? roles.set(p, new Set()).get(p)!).add("publisher");
  }
  for (const [slug, r] of roles) {
    if (out.has(slug)) continue;
    const name = names.get(slug) ?? slug;
    out.set(slug, {
      slug,
      name,
      kind: r.size === 2 ? "both" : r.has("studio") ? "studio" : "publisher",
      monogram: name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 3).map((w) => w[0]).join("").toUpperCase() || "?",
      colors: [PALETTES[hash(name) % PALETTES.length][2], PALETTES[hash(name) % PALETTES.length][1]],
      history: `A detailed profile for ${name} hasn't been added yet. Its games in the FRAMEWISE catalog are listed below.`,
    });
  }
  return [...out.values()];
}

/** Display names for studio slugs found in the extended data. */
export function extendedStudioNames(): Map<string, string> {
  const m = new Map<string, string>();
  for (const raw of EXTENDED_GAMES.split("\n")) {
    const parts = raw.trim().split("|");
    if (parts.length < 6) continue;
    for (const n of [...parts[4].split(";"), ...parts[5].split(";")]) m.set(studioSlug(n), n.trim());
  }
  return m;
}
