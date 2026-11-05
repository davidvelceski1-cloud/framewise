import { cpuByName, findCpu, findGpu, gpuByName, type CpuEntry, type GpuEntry } from "./data/hardware";
import { modeLabels, platformById, platforms, releasePlatformMeta } from "./platforms";
import type { Catalog, Game, Mode, PcRequirements, PerformanceTest, PlatformId } from "./types";
import { fmtFps } from "./utils";

/* ───────────────────────── scoring ───────────────────────── */

export function axisScores(t: PerformanceTest) {
  const frameRate = Math.min(100, (Math.min(t.fpsAvg, 120) / 120) * 100);
  const stability = Math.max(0, Math.min(100, ((t.fps1Low / t.fpsAvg - 0.55) / 0.42) * 100));
  const resolution = Math.min(100, (t.nativePixels / 2160) * 100);
  const features = (t.rayTracing ? 50 : 0) + (t.hdr ? 25 : 0) + (t.vrr ? 25 : 0);
  const loading = Math.min(100, (5 / Math.max(t.loadSec, 1)) * 100);
  return { frameRate, stability, resolution, features, loading };
}

export function overallScore(t: PerformanceTest) {
  const a = axisScores(t);
  return a.frameRate * 0.42 + a.stability * 0.1 + a.resolution * 0.28 + a.features * 0.1 + a.loading * 0.1;
}

export function bestTestPerPlatform(tests: PerformanceTest[]) {
  const by = new Map<PlatformId, PerformanceTest>();
  for (const t of tests) {
    const cur = by.get(t.platform);
    if (!cur || overallScore(t) > overallScore(cur)) by.set(t.platform, t);
  }
  return [...by.values()].sort((a, b) => overallScore(b) - overallScore(a));
}

export function pickWinner(tests: PerformanceTest[]) {
  if (tests.length < 2) return null;
  const ranked = [...tests].sort((a, b) => overallScore(b) - overallScore(a));
  const [w, r] = ranked;
  const wa = axisScores(w);
  const ra = axisScores(r);
  const reasons: string[] = [];
  if (w.fpsAvg > r.fpsAvg + 2) reasons.push(`${fmtFps(w.fpsAvg)} fps average vs ${fmtFps(r.fpsAvg)}`);
  if (w.nativePixels > r.nativePixels) reasons.push(`a higher ${w.nativePixels}p internal resolution`);
  if (wa.features > ra.features) reasons.push(w.rayTracing && !r.rayTracing ? "ray tracing" : "HDR/VRR support");
  if (w.loadSec < r.loadSec - 1) reasons.push(`faster loads (${w.loadSec}s)`);
  if (!reasons.length) reasons.push("a better balance of frame rate, image quality and stability");
  return {
    winner: w,
    runnerUp: r,
    explanation: `${platformById[w.platform].name} wins in ${modeLabels[w.mode]} mode thanks to ${joinList(reasons)} compared with ${platformById[r.platform].short}.`,
  };
}

export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ───────────────────────── verdicts ───────────────────────── */

export function comparisonVerdict(game: Game, tests: PerformanceTest[]) {
  if (!tests.length) return `There is no performance data for ${game.title} on the selected platforms yet.`;
  const ranked = [...tests].sort((a, b) => overallScore(b) - overallScore(a));
  const best = ranked[0];
  const sharpest = [...tests].sort((a, b) => b.nativePixels - a.nativePixels)[0];
  const fastest = [...tests].sort((a, b) => b.fpsAvg - a.fpsAvg)[0];
  const quickest = [...tests].sort((a, b) => a.loadSec - b.loadSec)[0];
  const weakest = ranked[ranked.length - 1];
  const s: string[] = [];
  s.push(
    `${platformById[best.platform].name} offers the best overall experience in ${game.title}, averaging ${fmtFps(best.fpsAvg)} fps at ${best.nativeRes} in ${modeLabels[best.mode]} mode.`,
  );
  if (fastest.id !== best.id)
    s.push(`For raw frame rate, ${platformById[fastest.platform].short} leads at ${fmtFps(fastest.fpsAvg)} fps (${modeLabels[fastest.mode]}).`);
  if (sharpest.id !== best.id)
    s.push(`${platformById[sharpest.platform].short} renders the sharpest image at ${sharpest.nativeRes} internal resolution.`);
  if (ranked.length > 2 && weakest.id !== best.id)
    s.push(
      `${platformById[weakest.platform].short} is the most compromised, at ${fmtFps(weakest.fpsAvg)} fps and ${weakest.nativeRes}${weakest.targetFps ? ` against a ${weakest.targetFps} fps target` : ""}.`,
    );
  if (tests.length > 1) s.push(`Loading is quickest on ${platformById[quickest.platform].short} (${quickest.loadSec}s to load a save).`);
  else s.push(`It isn't benchmarked on any other platform in our database yet.`);
  return s.slice(0, 4).join(" ");
}

/* ───────────────────────── can I run it ───────────────────────── */

export interface Build {
  gpu: string;
  cpu: string;
  ram: number;
  resolution: 1080 | 1440 | 2160;
}

export type Confidence = "High" | "Medium" | "Low";

export interface RunEstimate {
  gameSlug: string;
  ok: boolean;
  verdict: "Exceeds recommended" | "Meets recommended" | "Meets minimum" | "Below minimum" | "Unsupported" | "Unknown hardware";
  preset: "Ultra" | "High" | "Medium" | "Low" | "—";
  fps: number | null;
  resolution: number;
  confidence: Confidence;
  notes: string[];
  gpu?: GpuEntry;
  cpu?: CpuEntry;
  /** estimated fps for every preset, so the UI can show the trade-off */
  byPreset?: Record<"Ultra" | "High" | "Medium" | "Low", number>;
}

const PRESET_MULT = { Ultra: 0.82, High: 1, Medium: 1.3, Low: 1.65 } as const;

function parseTarget(target: string) {
  const fps = Number(/(\d+)\s*fps/i.exec(target)?.[1] ?? 60);
  const res = Number(/(\d{3,4})p/i.exec(target)?.[1] ?? 1080);
  return { fps, res };
}

export function estimateRun(game: Pick<Game, "slug" | "title">, req: PcRequirements | null | undefined, build: Build): RunEstimate {
  const base = { gameSlug: game.slug, resolution: build.resolution };
  if (!req) {
    return { ...base, ok: false, verdict: "Unsupported", preset: "—", fps: null, confidence: "High", notes: [`${game.title} is not available on PC.`] };
  }
  const gpu = gpuByName(build.gpu) ?? findGpu(build.gpu);
  const cpu = cpuByName(build.cpu) ?? findCpu(build.cpu);
  if (!gpu) {
    return { ...base, ok: false, verdict: "Unknown hardware", preset: "—", fps: null, confidence: "Low", notes: [`"${build.gpu}" isn't in our GPU index, so no estimate is possible.`] };
  }
  const recGpu = gpuByName(req.refs.recGpu)!;
  const minGpu = gpuByName(req.refs.minGpu)!;
  const recCpu = cpuByName(req.refs.recCpu);
  const minCpu = cpuByName(req.refs.minCpu);
  const notes: string[] = [];

  const rtRequired = /RT required/i.test(req.minimum.api);
  if (rtRequired && !gpu.rt) {
    return { ...base, ok: false, verdict: "Unsupported", preset: "—", fps: null, confidence: "High", gpu, cpu, notes: [`${game.title} requires a ray-tracing capable GPU; the ${gpu.name} doesn't support hardware RT.`] };
  }

  const { fps: recFps, res: recRes } = parseTarget(req.recommended.target);
  const resFactor = Math.pow(recRes / build.resolution, 1.3);
  const gpuFps = recFps * (gpu.score / recGpu.score) * resFactor;
  const cpuCap = cpu && recCpu ? recFps * (cpu.score / recCpu.score) * 1.7 : Infinity;
  if (cpu && recCpu && cpuCap < gpuFps * PRESET_MULT.High) notes.push(`Your ${cpu.name} is likely to limit frame rate before the GPU does.`);

  const fpsFor = (p: keyof typeof PRESET_MULT) => Math.min(gpuFps * PRESET_MULT[p], cpuCap);
  const order: (keyof typeof PRESET_MULT)[] = ["Ultra", "High", "Medium", "Low"];
  const preset: RunEstimate["preset"] = order.find((p) => fpsFor(p) >= 60) ?? order.find((p) => fpsFor(p) >= 30) ?? "Low";
  const fps = Math.round(fpsFor(preset as keyof typeof PRESET_MULT));

  if (build.ram < req.minimum.ram) notes.push(`${build.ram} GB RAM is below the ${req.minimum.ram} GB minimum.`);
  else if (build.ram < req.recommended.ram) notes.push(`${req.recommended.ram} GB RAM is recommended; you have ${build.ram} GB.`);
  if (gpu.vram < req.minimum.vram) notes.push(`${gpu.vram} GB VRAM is below the ${req.minimum.vram} GB minimum; expect texture streaming issues.`);
  if (req.recommended.storage.includes("SSD")) notes.push("An SSD is recommended.");

  const meetsRec = gpu.score >= recGpu.score && (!cpu || !recCpu || cpu.score >= recCpu.score) && build.ram >= req.recommended.ram;
  const exceeds = gpu.score >= recGpu.score * 1.5 && (!cpu || !recCpu || cpu.score >= recCpu.score * 1.2);
  const meetsMin = gpu.score >= minGpu.score && (!cpu || !minCpu || cpu.score >= minCpu.score) && build.ram >= req.minimum.ram;
  const verdict: RunEstimate["verdict"] = exceeds && meetsRec ? "Exceeds recommended" : meetsRec ? "Meets recommended" : meetsMin ? "Meets minimum" : "Below minimum";

  const ratio = gpu.score / recGpu.score;
  let confidence: Confidence = ratio >= 0.5 && ratio <= 2.2 ? "High" : ratio >= 0.3 && ratio <= 3.5 ? "Medium" : "Low";
  if (!cpu) {
    notes.push(`CPU "${build.cpu || "unspecified"}" isn't in our index; the estimate assumes it isn't a bottleneck.`);
    confidence = confidence === "High" ? "Medium" : "Low";
  }
  if (build.resolution !== recRes) confidence = confidence === "High" ? "Medium" : confidence;

  const byPreset = Object.fromEntries(order.map((p) => [p, Math.round(fpsFor(p))])) as RunEstimate["byPreset"];
  return { ...base, ok: meetsMin, verdict, preset, fps, confidence, notes, gpu, cpu, byPreset };
}

/* ───────────────────────── natural-language search ───────────────────────── */

export interface NlFilters {
  text: string[];
  platforms: PlatformId[];
  minFps?: number;
  tags: string[];
  genres: string[];
  engine?: string;
  yearFrom?: number;
  yearTo?: number;
  console?: boolean;
  description: string[];
}

const PLATFORM_WORDS: [RegExp, PlatformId][] = [
  [/steam\s*deck|\bdeck\b/, "steam-deck"],
  [/ps5\s*pro|playstation 5 pro/, "ps5-pro"],
  [/\bps5\b|playstation(?! 5 pro)/, "ps5"],
  [/series\s*x|\bxsx\b/, "xbox-series-x"],
  [/series\s*s\b|\bxss\b/, "xbox-series-s"],
  [/\bxbox\b(?!.*series)/, "xbox-series-x"],
  [/switch\s*2|switch two/, "switch-2"],
  [/\bswitch\b(?!\s*2)/, "switch"],
  [/\bpc\b/, "pc-high"],
];

export function parseNlQuery(q: string, catalog: { games: Pick<Game, "tags" | "genres">[] }): NlFilters {
  const s = ` ${q.toLowerCase()} `;
  const f: NlFilters = { text: [], platforms: [], tags: [], genres: [], description: [] };
  for (const [re, id] of PLATFORM_WORDS) {
    if (re.test(s) && !f.platforms.includes(id)) {
      if (id === "switch" && f.platforms.includes("switch-2")) continue;
      if (id === "ps5" && f.platforms.includes("ps5-pro")) continue;
      f.platforms.push(id);
    }
  }
  if (f.platforms.includes("pc-high")) f.platforms.push("pc-mid");
  if (/\bconsoles?\b/.test(s)) f.console = true;
  const fps = /(?:over|above|at least|more than|>=?|min(?:imum)?)\s*(\d{2,3})\s*(?:fps|frames)|(\d{2,3})\s*(?:fps|frames)\s*(?:\+|or more|and up|plus)?/.exec(s);
  if (fps) f.minFps = Number(fps[1] ?? fps[2]);
  const allTags = new Set(catalog.games.flatMap((g) => g.tags));
  for (const t of allTags) {
    const re = new RegExp(`\\b${t.replace("-", "[\\s-]?")}\\b`);
    if (re.test(s)) f.tags.push(t);
  }
  const allGenres = new Set(catalog.games.flatMap((g) => g.genres));
  for (const gnr of allGenres) {
    const base = gnr.toLowerCase();
    if (new RegExp(`\\b${base}s?\\b`).test(s) || (base === "rpg" && /role.?playing/.test(s)) || (base === "shooter" && /\bfps games?\b/.test(s))) f.genres.push(gnr);
  }
  const eng = /(unreal(?: engine)?\s*\d?|ue[45]|re engine|id tech|redengine|northlight|unity|creation engine)/.exec(s);
  if (eng) f.engine = eng[1].replace(/^ue(\d)/, "unreal engine $1");
  const after = /(?:after|since|from)\s*(20\d\d)/.exec(s);
  const before = /(?:before|until)\s*(20\d\d)/.exec(s);
  const inYear = /\b(?:in|released)\s*(20\d\d)\b/.exec(s);
  if (after) f.yearFrom = Number(after[1]);
  if (before) f.yearTo = Number(before[1]);
  if (inYear && !after && !before) f.yearFrom = f.yearTo = Number(inYear[1]);

  if (f.tags.length) f.description.push(f.tags.join(", "));
  if (f.genres.length) f.description.push(f.genres.join(", "));
  if (f.minFps) f.description.push(`≥ ${f.minFps} fps`);
  if (f.platforms.length) f.description.push(`on ${f.platforms.filter((p) => p !== "pc-mid").map((p) => platformById[p].short).join(" / ")}`);
  else if (f.console) f.description.push("on console");
  if (f.engine) f.description.push(f.engine);
  if (f.yearFrom || f.yearTo) f.description.push(f.yearFrom === f.yearTo ? `${f.yearFrom}` : `${f.yearFrom ?? ""}–${f.yearTo ?? ""}`);
  return f;
}

/** Minimal shapes so the same filters run on the server catalog and on slim client data. */
export type FilterGame = Pick<Game, "slug" | "tags" | "genres" | "engine" | "releaseDate">;
export type FilterTest = Pick<PerformanceTest, "gameSlug" | "platform" | "mode" | "fpsAvg">;

export function applyNlFilters<G extends FilterGame, T extends FilterTest>(f: NlFilters, catalog: { games: G[]; tests: T[] }) {
  const byGame = new Map<string, T[]>();
  for (const t of catalog.tests) (byGame.get(t.gameSlug) ?? byGame.set(t.gameSlug, []).get(t.gameSlug)!).push(t);
  const out: { game: G; evidence?: T }[] = [];
  for (const g of catalog.games) {
    if (f.tags.length && !f.tags.every((t) => g.tags.includes(t))) continue;
    if (f.genres.length && !f.genres.some((x) => g.genres.includes(x))) continue;
    if (f.engine && !g.engine.toLowerCase().includes(f.engine.replace(/\s*\d$/, "").trim()) && !g.engine.toLowerCase().includes(f.engine)) continue;
    const y = Number(g.releaseDate.slice(0, 4));
    if (f.yearFrom && y < f.yearFrom) continue;
    if (f.yearTo && y > f.yearTo) continue;
    let tests = byGame.get(g.slug) ?? [];
    if (f.platforms.length) tests = tests.filter((t) => f.platforms.includes(t.platform));
    else if (f.console) tests = tests.filter((t) => platformById[t.platform].family !== "pc");
    if ((f.platforms.length || f.console) && !tests.length) continue;
    if (f.minFps) {
      tests = tests.filter((t) => t.fpsAvg >= f.minFps! - 1.5);
      if (!tests.length) continue;
    }
    out.push({ game: g, evidence: [...tests].sort((a, b) => b.fpsAvg - a.fpsAvg)[0] });
  }
  return out;
}

/* ───────────────────────── retrieval / assistant ───────────────────────── */

// Nicknames only — full titles are matched automatically. Keep these specific so they
// don't collide with other entries (e.g. "God of War (2018)" vs Ragnarök).
const ALIASES: Record<string, string[]> = {
  "cyberpunk-2077": ["cyberpunk", "cp2077"],
  "baldurs-gate-3": ["baldur", "bg3", "baldurs gate"],
  "alan-wake-2": ["alan wake 2", "aw2"],
  "red-dead-redemption-2": ["red dead", "rdr2", "rdr 2"],
  "god-of-war-ragnarok": ["ragnarok", "ragnarök"],
  "forza-horizon-5": ["forza horizon", "fh5"],
  "black-myth-wukong": ["wukong", "black myth"],
  "marvels-spider-man-2": ["spider-man 2", "spiderman 2", "spider man 2"],
  "hogwarts-legacy": ["hogwarts"],
  "indiana-jones-and-the-great-circle": ["indiana jones", "great circle"],
  "doom-the-dark-ages": ["dark ages"],
  "monster-hunter-wilds": ["mh wilds", "monster hunter wilds"],
  "the-witcher-3": ["witcher 3", "witcher"],
  "hollow-knight-silksong": ["silksong"],
  "mario-kart-world": ["mkw"],
  "zelda-tears-of-the-kingdom": ["tears of the kingdom", "totk"],
  "the-legend-of-zelda-breath-of-the-wild": ["breath of the wild", "botw"],
  "grand-theft-auto-v": ["gta v", "gta 5", "gta5"],
  "the-elder-scrolls-v-skyrim-special-edition": ["skyrim"],
  "the-elder-scrolls-iv-oblivion-remastered": ["oblivion"],
  "final-fantasy-vii-rebirth": ["ff7 rebirth", "ffvii rebirth"],
  "final-fantasy-xvi": ["ff16", "ffxvi"],
  "call-of-duty-black-ops-6": ["black ops 6", "bo6"],
  "counter-strike-2": ["cs2"],
  "ghost-of-tsushima": ["tsushima"],
  "the-last-of-us-part-i": ["the last of us part 1", "tlou1"],
  "the-last-of-us-part-ii-remastered": ["the last of us part 2", "tlou2"],
  "clair-obscur-expedition-33": ["expedition 33", "clair obscur"],
  "kingdom-come-deliverance-ii": ["kcd2", "kingdom come deliverance 2"],
  "senuas-saga-hellblade-ii": ["hellblade 2", "hellblade ii"],
};

// Single-word titles that are also ordinary words only match when capitalised as written.
const COMMON_WORD_TITLES = new Set(["control", "inside", "grounded", "satisfactory", "avowed", "hades", "returnal", "deathloop"]);
const escapeRe = (x: string) => x.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
const phrase = (x: string, flags = "u") => new RegExp("(^|[^\\p{L}\\p{N}])" + escapeRe(x) + "(?=$|[^\\p{L}\\p{N}])", flags);

export function detectGames<G extends Pick<Game, "slug" | "title">>(q: string, games: G[]): G[] {
  const lower = q.toLowerCase();
  const hits = games.filter((g) => {
    const t = g.title.toLowerCase();
    const titleHit = COMMON_WORD_TITLES.has(t) ? phrase(g.title).test(q) : phrase(t).test(lower);
    return titleHit || (ALIASES[g.slug] ?? []).some((a) => phrase(a).test(lower));
  });
  // Longest title wins: "Hades II" suppresses "Hades", "Elden Ring Nightreign" suppresses "Elden Ring".
  return hits.filter(
    (g) => !hits.some((o) => o !== g && o.title.length > g.title.length && o.title.toLowerCase().includes(g.title.toLowerCase()) && lower.includes(o.title.toLowerCase())),
  );
}

export function detectPlatforms(q: string): PlatformId[] {
  return parseNlQuery(q, { games: [] }).platforms.filter((p) => p !== "pc-mid");
}

export function detectResolution(q: string): Build["resolution"] | undefined {
  const s = q.toLowerCase();
  if (/4k|2160p/.test(s)) return 2160;
  if (/1440p|2k\b|qhd/.test(s)) return 1440;
  if (/1080p|full ?hd|fhd/.test(s)) return 1080;
  return undefined;
}

export interface Citation {
  id: string; // S1…
  label: string;
  href?: string;
}

export interface Retrieved {
  intent: "can-run" | "best-platform" | "compare" | "platform" | "search" | "game-info" | "unknown";
  games: Game[];
  platforms: PlatformId[];
  context: string; // compact, citation-tagged records for the LLM
  citations: Citation[];
  localAnswer: string;
}

function testLine(t: PerformanceTest) {
  return `${platformById[t.platform].short} ${modeLabels[t.mode]}: ${fmtFps(t.fpsAvg)} fps avg (1% low ${fmtFps(t.fps1Low)}, target ${t.targetFps ?? "uncapped"}), ${t.nativeRes} → ${t.outputRes}, ${t.upscaler}, RT ${t.rayTracing ? "on" : "off"}, load ${t.loadSec}s, patch ${t.patchVersion}`;
}

export function retrieve(question: string, catalog: Catalog, savedBuild?: Partial<Build>): Retrieved {
  const games = detectGames(question, catalog.games);
  const plats = detectPlatforms(question);
  const gpu = findGpu(question) ?? (savedBuild?.gpu ? gpuByName(savedBuild.gpu) : undefined);
  const cpu = findCpu(question) ?? (savedBuild?.cpu ? cpuByName(savedBuild.cpu) : undefined);
  const res = detectResolution(question) ?? savedBuild?.resolution ?? 1080;
  const s = question.toLowerCase();
  const citations: Citation[] = [];
  const ctx: string[] = [];
  const cite = (label: string, href?: string) => {
    const id = `S${citations.length + 1}`;
    citations.push({ id, label, href });
    return id;
  };

  const mentionsRun = /can (?:my|i|a|an|the)|run|handle|playable|enough/.test(s);
  let intent: Retrieved["intent"] = "unknown";
  const gpuMention = /\b(?:rtx|gtx|rx|radeon|geforce|arc|gpu|graphics card)\b/.test(s);
  if (games.length && (findGpu(question) || (mentionsRun && (gpu || gpuMention)))) intent = "can-run";
  else if (games.length && plats.length >= 2) intent = "compare";
  else if (games.length && plats.length === 1 && !/best|where/.test(s)) intent = "platform";
  else if (games.length && /best|where|which (platform|console|version)|run(s)? (the )?best|should i (buy|play)/.test(s)) intent = "best-platform";
  else if (!games.length && /(games?|titles?)\b/.test(s)) intent = "search";
  else if (games.length) intent = "game-info";

  const out: string[] = [];

  if (intent === "can-run") {
    const g = games[0];
    const req = catalog.requirements.find((r) => r.gameSlug === g.slug);
    const rawGpu = /(?:rtx|gtx|rx|radeon|geforce|arc)\s*[a-z]*\s*\d{3,4}\s*(?:ti|super|xt|xtx)?/i.exec(question)?.[0] ?? "your GPU";
    const est = estimateRun(g, req, { gpu: gpu?.name ?? rawGpu, cpu: cpu?.name ?? "", ram: savedBuild?.ram ?? 16, resolution: res });
    const rid = req ? cite(`${g.title} — PC requirements (${req.source})`, `/games/${g.slug}#specs`) : undefined;
    const eid = cite(`FRAMEWISE estimator — ${gpu?.name ?? "GPU"}${cpu ? ` + ${cpu.name}` : ""} at ${res}p`, `/can-i-run?game=${g.slug}`);
    if (req) {
      ctx.push(`[${rid}] ${g.title} PC requirements — Minimum: ${req.minimum.cpu}; ${req.minimum.gpu}; ${req.minimum.ram} GB RAM (${req.minimum.target}). Recommended: ${req.recommended.cpu}; ${req.recommended.gpu}; ${req.recommended.ram} GB RAM (${req.recommended.target}).`);
    }
    ctx.push(`[${eid}] Estimate: verdict "${est.verdict}", preset ${est.preset}, ~${est.fps ?? "n/a"} fps at ${res}p, confidence ${est.confidence}. Notes: ${est.notes.join(" ") || "none"}. RAM assumed ${savedBuild?.ram ?? 16} GB unless stated.`);
    const pcTests = catalog.tests.filter((t) => t.gameSlug === g.slug && platformById[t.platform].family === "pc");
    const ref = pcTests.find((t) => t.platform === ((gpu?.score ?? 0) > 190 ? "pc-high" : "pc-mid") && t.mode === "performance");
    let refId: string | undefined;
    if (ref) {
      refId = cite(`${g.title} · ${platformById[ref.platform].name} · ${modeLabels[ref.mode]} (${ref.source.label}${ref.demo ? ", demo" : ""})`, `/compare?game=${g.slug}`);
      ctx.push(`[${refId}] ${testLine(ref)}`);
    }
    if (!req) out.push(`${g.title} isn't available on PC, so a PC build can't run it.`);
    else if (est.fps === null) out.push(est.notes.join(" "));
    else {
      out.push(
        `**${est.verdict}.** With your ${gpu ? gpu.name : "GPU"}${cpu ? ` and ${cpu.name}` : ""}, ${g.title} should run at about **${est.fps} fps at ${res}p on the ${est.preset} preset** [${eid}].`,
      );
      if (est.byPreset) out.push(`By preset at ${res}p: ${(["Ultra", "High", "Medium", "Low"] as const).map((p) => `${p} ~${est.byPreset![p]} fps`).join(" · ")} [${eid}].`);
      out.push(`For reference, the ${req.source.startsWith("FRAMEWISE estimate") ? "estimated (unofficial) " : ""}recommended spec is ${req.recommended.gpu.split(" / ")[0]} for ${req.recommended.target} [${rid}].`);
      if (ref) out.push(`Our ${platformById[ref.platform].short} reference build measured ${fmtFps(ref.fpsAvg)} fps in Performance mode (${ref.nativeRes} → ${ref.outputRes}, ${ref.upscaler}) [${refId}].`);
      if (est.notes.length) out.push(est.notes.join(" "));
      out.push(`Confidence: **${est.confidence}**. This is an estimate scaled from the requirements, not a measured benchmark.`);
    }
  } else if (intent === "platform") {
    const g = games[0];
    const p = plats[0];
    const ids = p === "pc-high" ? ["pc-mid", "pc-high"] : [p];
    const tests = catalog.tests.filter((t) => t.gameSlug === g.slug && ids.includes(t.platform));
    if (!tests.length) {
      const released = g.releases.map((r) => releasePlatformMeta[r.platform].label).join(", ");
      out.push(`FRAMEWISE has no performance data for **${g.title}** on ${platformById[p].name}. It is listed for: ${released}.`);
      const best = bestTestPerPlatform(catalog.tests.filter((t) => t.gameSlug === g.slug))[0];
      if (best) {
        const id = cite(`${g.title} · ${platformById[best.platform].short} · ${modeLabels[best.mode]} — ${best.source.label}${best.demo ? " (demo data)" : ""}`, `/compare?game=${g.slug}`);
        ctx.push(`[${id}] ${testLine(best)}`);
        out.push(`Where we do have data, it runs best on ${platformById[best.platform].name}: ${fmtFps(best.fpsAvg)} fps at ${best.nativeRes} [${id}].`);
      }
    } else {
      out.push(`Here is how **${g.title}** runs on ${platformById[p].family === "pc" ? "PC" : platformById[p].name}:`);
      for (const t of tests.sort((a, b) => b.fpsAvg - a.fpsAvg)) {
        const id = cite(`${g.title} · ${platformById[t.platform].short} · ${modeLabels[t.mode]} — ${t.source.label}${t.demo ? " (demo data)" : ""}`, `/compare?game=${g.slug}&p=${t.platform}.${t.mode}`);
        ctx.push(`[${id}] ${testLine(t)}`);
        out.push(`- **${modeLabels[t.mode]}${ids.length > 1 ? ` (${platformById[t.platform].short})` : ""}** — ${fmtFps(t.fpsAvg)} fps avg${t.targetFps ? ` (target ${t.targetFps})` : ""}, ${t.nativeRes} → ${t.outputRes}, ${t.upscaler}${t.rayTracing ? ", ray tracing on" : ""} [${id}]`);
      }
      if (tests.some((t) => t.demo)) out.push("_Figures are seeded demo data until verified benchmarks replace them._");
    }
  } else if (intent === "best-platform" || intent === "compare" || intent === "game-info") {
    for (const g of games.slice(0, 2)) {
      let tests = catalog.tests.filter((t) => t.gameSlug === g.slug);
      if (intent === "compare") tests = tests.filter((t) => plats.includes(t.platform) || (plats.includes("pc-high") && t.platform === "pc-mid"));
      const best = bestTestPerPlatform(tests);
      const gid = cite(`${g.title} — catalog entry`, `/games/${g.slug}`);
      ctx.push(`[${gid}] ${g.title} (${g.releaseDate.slice(0, 4)}), developer ${g.developers.join(", ")}, publisher ${g.publishers.join(", ")}, engine ${g.engine}, director ${g.credits.director ?? "not in database"}, composer ${g.credits.composer ?? "not in database"}. Released on ${g.releases.map((r) => r.platform).join(", ")}.`);
      const lines = best.map((t) => {
        const id = cite(`${g.title} · ${platformById[t.platform].short} · ${modeLabels[t.mode]} — ${t.source.label}${t.demo ? " (demo data)" : ""}`, `/compare?game=${g.slug}`);
        ctx.push(`[${id}] ${testLine(t)}`);
        return { t, id };
      });
      if (intent === "game-info") {
        const devs = catalog.studios.filter((x) => g.developers.includes(x.slug)).map((x) => x.name).join(", ");
        out.push(`**${g.title}** (${g.releaseDate.slice(0, 4)}) is developed by ${devs} on ${g.engine}${g.credits.director ? `, directed by ${g.credits.director}` : ""} [${gid}].`);
      }
      if (!lines.length) {
        out.push(`I don't have performance data for ${g.title}${plats.length ? " on those platforms" : ""} yet, so I won't guess.`);
        continue;
      }
      const top = lines[0];
      if (intent !== "game-info" || lines.length) {
        out.push(
          `${intent === "compare" ? "Between the selected platforms" : "Across every platform we track"}, **${g.title} runs best on ${platformById[top.t.platform].name}** — ${fmtFps(top.t.fpsAvg)} fps average at ${top.t.nativeRes} in ${modeLabels[top.t.mode]} mode [${top.id}].`,
        );
        const rest = lines.slice(1, 4).map(({ t, id }) => `${platformById[t.platform].short}: ${fmtFps(t.fpsAvg)} fps at ${t.nativeRes} (${modeLabels[t.mode]}) [${id}]`);
        if (rest.length) out.push(`Next: ${rest.join("; ")}.`);
        const missing = plats.filter((p) => !lines.some((l) => l.t.platform === p));
        if (missing.length) out.push(`No data for ${missing.map((p) => platformById[p].short).join(", ")} — the game may not be released there, or it hasn't been tested.`);
      }
    }
    if (catalog.tests.some((t) => games.some((g) => g.slug === t.gameSlug) && t.demo)) out.push("_Figures are seeded demo data until verified benchmarks replace them._");
  } else if (intent === "search") {
    const f = parseNlQuery(question, catalog);
    const results = applyNlFilters(f, catalog).slice(0, 8);
    if (!results.length) {
      out.push(`No games in the database match ${f.description.join(" · ") || "that description"}.`);
      // Offer the closest real data instead of guessing: relax only the fps threshold.
      if (f.minFps) {
        const near = applyNlFilters({ ...f, minFps: undefined }, catalog)
          .filter((r) => r.evidence)
          .sort((a, b) => b.evidence!.fpsAvg - a.evidence!.fpsAvg)
          .slice(0, 4);
        if (near.length) {
          out.push(`Closest matches below ${f.minFps} fps:`);
          for (const r of near) {
            const id = cite(`${r.game.title} · ${platformById[r.evidence!.platform].short} ${modeLabels[r.evidence!.mode]} — ${r.evidence!.source.label}`, `/games/${r.game.slug}`);
            ctx.push(`[${id}] ${r.game.title}: ${testLine(r.evidence!)}`);
            out.push(`- **${r.game.title}** — ${fmtFps(r.evidence!.fpsAvg)} fps on ${platformById[r.evidence!.platform].short} (${modeLabels[r.evidence!.mode]}) [${id}]`);
          }
        }
      }
    } else {
      out.push(`Games matching **${f.description.join(" · ") || "your query"}**:`);
      for (const r of results) {
        const id = cite(`${r.game.title}${r.evidence ? ` · ${platformById[r.evidence.platform].short} ${modeLabels[r.evidence.mode]} — ${r.evidence.source.label}` : ""}`, `/games/${r.game.slug}`);
        ctx.push(`[${id}] ${r.game.title}: ${r.evidence ? testLine(r.evidence) : "matches filters"}`);
        out.push(`- **${r.game.title}**${r.evidence ? ` — ${fmtFps(r.evidence.fpsAvg)} fps on ${platformById[r.evidence.platform].short} (${modeLabels[r.evidence.mode]})` : ""} [${id}]`);
      }
    }
  } else {
    out.push(
      "I can answer questions about the games and benchmarks in the FRAMEWISE database — for example *“Can my RTX 3060 run Cyberpunk 2077 at 1440p?”*, *“Where does Elden Ring run best?”*, *“Compare Hogwarts Legacy on Switch 2 and Steam Deck”* or *“open-world games over 60 fps on Steam Deck”*. I couldn't match a game or hardware in your question.",
    );
  }

  return { intent, games, platforms: plats, context: ctx.join("\n"), citations, localAnswer: out.join("\n\n") };
}

/* ───────────────────────── misc helpers ───────────────────────── */

export function testsFor(catalog: Catalog, slug: string, platform?: PlatformId, mode?: Mode) {
  return catalog.tests.filter((t) => t.gameSlug === slug && (!platform || t.platform === platform) && (!mode || t.mode === mode));
}

export function platformsForGame(catalog: Catalog, slug: string) {
  const ids = new Set(catalog.tests.filter((t) => t.gameSlug === slug).map((t) => t.platform));
  return platforms.filter((p) => ids.has(p.id));
}

/** Separates streamed assistant text from the trailing citations JSON. */
export const CITATION_SEP = "\u0000CITATIONS\u0000";
