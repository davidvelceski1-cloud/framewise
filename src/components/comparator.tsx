"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Check, ChevronDown, Crown, Download, Link2, Search, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { families, modeLabels, platformById, platforms } from "@/lib/platforms";
import { overallScore, pickWinner } from "@/lib/analysis";
import type { Game, Mode, PerformanceTest, PlatformId } from "@/lib/types";
import { cn, fmtFps } from "@/lib/utils";
import { FpsBarChart, FrametimeChart, QualityRadar } from "./charts";
import { ImageCompare } from "./image-compare";
import { useApp } from "./providers";
import { Counter, EmptyState, GameCover, Pill, Skeleton, SourceBadge } from "./ui";

type GameLite = Pick<Game, "slug" | "title" | "cover" | "coverUrl" | "releaseDate" | "genres">;
type Sel = { platform: PlatformId; mode: Mode };

const PREFERRED: PlatformId[] = ["ps5", "xbox-series-x", "pc-high", "steam-deck", "switch-2", "switch", "ps5-pro", "xbox-series-s", "pc-mid"];
const MODE_ORDER: Mode[] = ["performance", "balanced", "quality", "raytracing"];

function GameSelect({ games, value, onChange }: { games: GameLite[]; value?: string; onChange: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const current = games.find((g) => g.slug === value);
  const list = games.filter((g) => g.title.toLowerCase().includes(q.toLowerCase()));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQ("");
  };
  return (
    <div ref={ref} className="relative w-full md:w-[380px]">
      <div className="hairline flex h-12 items-center gap-3 rounded-2xl bg-card px-4 shadow-soft">
        <Search size={16} className="text-muted" />
        <input
          value={open ? q : current?.title ?? ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(list.length - 1, a + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === "Enter" && list[active]) pick(list[active].slug);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Choose a game…"
          className="h-full flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-muted"
          role="combobox"
          aria-expanded={open}
          aria-controls="game-options"
          aria-label="Game"
          aria-autocomplete="list"
        />
        <ChevronDown size={16} className="text-muted" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="game-options"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="glass hairline absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl p-1.5 shadow-lift"
          >
            {list.length === 0 && <li className="px-3 py-4 text-sm text-muted">No games match “{q}”.</li>}
            {list.map((g, i) => (
              <li key={g.slug} role="option" aria-selected={g.slug === value}>
                <button onMouseEnter={() => setActive(i)} onClick={() => pick(g.slug)} className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left", i === active && "bg-surface")}>
                  <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-10 w-8 shrink-0 rounded-lg [&_p]:hidden [&_div.h-px]:hidden" />
                  <span className="flex-1 text-[14px]">{g.title}</span>
                  <span className="tabular text-xs text-muted">{g.releaseDate.slice(0, 4)}</span>
                  {g.slug === value && <Check size={14} className="text-gold-ink" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function parseSel(p: string | null): Sel[] {
  if (!p) return [];
  return p
    .split(",")
    .map((x) => x.split("."))
    .filter(([pl, m]) => pl in platformById && MODE_ORDER.includes(m as Mode))
    .map(([pl, m]) => ({ platform: pl as PlatformId, mode: m as Mode }));
}

/** Loads one game's benchmark rows on demand (the catalog is too large to ship whole). */
function useGameTests(slug?: string) {
  const [state, setState] = useState<{ slug: string; tests: PerformanceTest[] } | null>(null);
  useEffect(() => {
    if (!slug) return;
    let live = true;
    fetch(`/api/tests?game=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((j) => live && setState({ slug, tests: j.tests ?? [] }))
      .catch(() => live && setState({ slug, tests: [] }));
    return () => {
      live = false;
    };
  }, [slug]);
  return state && state.slug === slug ? state.tests : null;
}

export function Comparator({ games }: { games: GameLite[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user, update } = useApp();
  const gameSlug = params.get("game") ?? undefined;
  const game = games.find((g) => g.slug === gameSlug);
  const loaded = useGameTests(gameSlug);
  const loading = Boolean(gameSlug) && loaded === null;
  const gameTests = useMemo(() => loaded ?? [], [loaded]);
  const available = useMemo(() => platforms.filter((p) => gameTests.some((t) => t.platform === p.id)), [gameTests]);
  const modesFor = (p: PlatformId) => MODE_ORDER.filter((m) => gameTests.some((t) => t.platform === p && t.mode === m));
  const defaultMode = (p: PlatformId): Mode => {
    const ms = modesFor(p);
    return ms.includes("performance") ? "performance" : ms[0];
  };

  let sel = parseSel(params.get("p")).filter((s) => gameTests.some((t) => t.platform === s.platform && t.mode === s.mode));
  if (game && !params.get("p")) {
    sel = PREFERRED.filter((p) => available.some((a) => a.id === p)).slice(0, 4).map((p) => ({ platform: p, mode: defaultMode(p) }));
  }
  const selTests = sel.map((s) => gameTests.find((t) => t.platform === s.platform && t.mode === s.mode)!).filter(Boolean);
  const winner = pickWinner(selTests);

  const setUrl = (slug: string | undefined, s: Sel[] | null) => {
    const q = new URLSearchParams();
    if (slug) q.set("game", slug);
    if (s) q.set("p", s.map((x) => `${x.platform}.${x.mode}`).join(","));
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const togglePlatform = (p: PlatformId) => {
    const has = sel.some((s) => s.platform === p);
    const next = has ? sel.filter((s) => s.platform !== p) : [...sel, { platform: p, mode: defaultMode(p) }];
    setUrl(gameSlug, next);
  };
  const setMode = (p: PlatformId, m: Mode) => setUrl(gameSlug, sel.map((s) => (s.platform === p ? { ...s, mode: m } : s)));

  // AI verdict
  // Results are tagged with the selection they belong to, so stale verdicts never show.
  const [summaryState, setSummary] = useState<{ key: string; text: string; engine: string } | null>(null);
  const key = selTests.map((t) => t.id).join("|");
  const summary = summaryState?.key === key ? summaryState : null;
  useEffect(() => {
    if (!game || selTests.length < 1) return;
    let live = true;
    fetch("/api/summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ game: game.slug, testIds: selTests.map((t) => t.id) }) })
      .then((r) => r.json())
      .then((j) => live && setSummary({ key, text: j.summary, engine: j.engine }))
      .catch(() => live && setSummary({ key, text: "Verdict unavailable right now.", engine: "local" }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, game?.slug]);

  // share / export / save
  const exportRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const note = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2200); };
  const share = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    note("Link copied");
  };
  const exportPng = async () => {
    if (!exportRef.current) return;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#FAF8F5";
    const url = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `framewise-${game?.slug ?? "comparison"}.png`;
    a.click();
    note("Image exported");
  };
  const save = () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    const url = `${pathname}?${new URLSearchParams({ game: gameSlug!, p: sel.map((x) => `${x.platform}.${x.mode}`).join(",") })}`;
    update((d) => ({
      ...d,
      comparisons: [{ id: crypto.randomUUID(), title: `${game!.title}: ${sel.map((s) => platformById[s.platform].short).join(" vs ")}`, url, createdAt: new Date().toISOString() }, ...d.comparisons.filter((c) => c.url !== url)],
    }));
    note("Saved to your dashboard");
  };

  const rows: { label: string; get: (t: PerformanceTest) => React.ReactNode; best?: (t: PerformanceTest) => number }[] = [
    { label: "Target fps", get: (t) => t.targetFps ?? "Uncapped" },
    { label: "1% lows", get: (t) => `${fmtFps(t.fps1Low)} fps`, best: (t) => t.fps1Low },
    { label: "Internal resolution", get: (t) => t.nativeRes, best: (t) => t.nativePixels },
    { label: "Output resolution", get: (t) => t.outputRes },
    { label: "Upscaling", get: (t) => t.upscaler },
    { label: "Graphics quality", get: (t) => t.quality, best: (t) => ["Low", "Medium", "High", "Ultra"].indexOf(t.quality) },
    { label: "Ray tracing", get: (t) => (t.rayTracing ? `Yes${t.rtNote ? ` · ${t.rtNote}` : ""}` : "No") },
    { label: "HDR / VRR", get: (t) => `${t.hdr ? "HDR" : "No HDR"} · ${t.vrr ? "VRR" : "No VRR"}` },
    { label: "Load time", get: (t) => `${t.loadSec}s`, best: (t) => -t.loadSec },
    { label: "Install size", get: (t) => `${t.installGB} GB`, best: (t) => -t.installGB },
    { label: "Patch tested", get: (t) => t.patchVersion },
  ];
  const isBest = (r: (typeof rows)[number], t: PerformanceTest) => {
    if (!r.best || selTests.length < 2) return false;
    const vals = selTests.map(r.best);
    const max = Math.max(...vals);
    return r.best(t) === max && vals.filter((v) => v === max).length < vals.length;
  };

  return (
    <div>
      {/* controls */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="mb-2 text-[11.5px] uppercase tracking-[0.14em] text-muted">Game</p>
            <GameSelect games={games} value={gameSlug} onChange={(s) => setUrl(s, null)} />
          </div>
          <div className="flex-1">
            <p className="mb-2 text-[11.5px] uppercase tracking-[0.14em] text-muted">Platforms</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select platforms">
              {platforms.map((p) => {
                const ok = available.some((a) => a.id === p.id);
                const on = sel.some((s) => s.platform === p.id);
                const f = families[p.family];
                return (
                  <button
                    key={p.id}
                    disabled={!ok}
                    onClick={() => togglePlatform(p.id)}
                    aria-pressed={on}
                    title={ok ? p.name : `No data for ${p.name}`}
                    className={cn("flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition", on ? "border-transparent shadow-soft" : "border-line bg-card hover:border-line-strong", !ok && "opacity-35 line-through")}
                    style={on ? { background: f.badgeBg, color: f.badgeFg } : undefined}
                  >
                    {on ? <Check size={13} /> : <span className="h-2 w-2 rounded-full" style={{ background: p.chart }} />}
                    {p.short}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!game ? (
        <div className="mt-8">
          <EmptyState title="Pick a game to begin" desc="Choose any title and we'll line up every platform side by side: frame rate, resolution, upscaling, ray tracing and load times." />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {games.slice(0, 12).map((g) => (
              <button key={g.slug} onClick={() => setUrl(g.slug, null)} className="lift text-left">
                <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="aspect-[3/4] w-full" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-display text-2xl font-semibold md:text-3xl">
              <Link href={`/games/${game.slug}`} className="hover:text-gold-ink">{game.title}</Link>
            </h2>
            <AnimatePresence>{flash && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-gold-ink" role="status">{flash}</motion.span>}</AnimatePresence>
            <button onClick={share} className="hairline flex h-9 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] hover:shadow-soft"><Link2 size={14} /> Share</button>
            <button onClick={exportPng} disabled={!selTests.length} className="hairline flex h-9 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] hover:shadow-soft disabled:opacity-40"><Download size={14} /> Export image</button>
            <button onClick={save} disabled={!selTests.length} className="flex h-9 items-center gap-2 rounded-full bg-ink px-3.5 text-[13px] text-bg disabled:opacity-40"><Bookmark size={14} /> Save</button>
          </div>

          {loading ? (
            <div className="mt-6 space-y-5" aria-busy="true" aria-label="Loading benchmarks">
              <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
              <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[520px]" />)}</div>
            </div>
          ) : selTests.length === 0 ? (
            <div className="mt-6"><EmptyState title="Select platforms" desc="Choose one or more platforms above to start the comparison." /></div>
          ) : (
            <div ref={exportRef} className="mt-6 space-y-6 rounded-[24px]">
              {/* verdict + winner */}
              <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <div className="card p-6">
                  <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-gold-ink"><Sparkles size={14} /> AI verdict</p>
                  {summary ? (
                    <p className="mt-3 text-[15.5px] leading-relaxed">{summary.text}</p>
                  ) : (
                    <div className="mt-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-3/4" /></div>
                  )}
                  <p className="mt-3 text-[11px] text-muted">
                    {summary?.engine === "claude" ? "Written by Claude from the records below." : "Generated from the records below."} {selTests.some((t) => t.demo) && "Includes demo data."}
                  </p>
                </div>
                <div className="card relative overflow-hidden p-6">
                  <div className="gold-gradient absolute inset-x-0 top-0 h-1" />
                  {winner ? (
                    <>
                      <span className="gold-gradient inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"><Crown size={13} /> Best on {platformById[winner.winner.platform].short}</span>
                      <p className="mt-4 text-[14px] leading-relaxed text-muted">{winner.explanation}</p>
                      <p className="tabular mt-3 text-[12px] text-muted">Overall score {overallScore(winner.winner).toFixed(0)} vs {overallScore(winner.runnerUp).toFixed(0)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">Add another platform to crown a winner.</p>
                  )}
                </div>
              </div>

              {/* grid (desktop) / swipeable cards (mobile) */}
              <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0" style={{ gridTemplateColumns: selTests.length === 1 ? "minmax(0, 440px)" : `repeat(${selTests.length}, minmax(0, 1fr))` }}>
                {selTests.map((t) => {
                  const p = platformById[t.platform];
                  const f = families[p.family];
                  const isWin = winner?.winner.id === t.id;
                  return (
                    <motion.div layout key={t.platform} className={cn("card w-[82vw] shrink-0 snap-center overflow-hidden md:w-auto", isWin && "ring-1 ring-gold")}>
                      <div className="relative p-5 text-white" style={{ background: `linear-gradient(135deg, ${f.gradient[0]}, ${f.gradient[1]})` }}>
                        {isWin && <Crown size={16} className="absolute right-4 top-4 text-[#F3E3BE]" aria-label="Winner" />}
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/75">{f.name}</p>
                        <p className="font-display text-xl font-semibold">{p.short}</p>
                        <div className="mt-3 flex flex-wrap gap-1" role="radiogroup" aria-label={`${p.short} mode`}>
                          {modesFor(t.platform).map((m) => (
                            <button key={m} role="radio" aria-checked={t.mode === m} onClick={() => setMode(t.platform, m)} className={cn("h-7 rounded-full px-2.5 text-[11.5px] transition", t.mode === m ? "bg-white text-[#0E1116]" : "bg-white/15 text-white hover:bg-white/25")}>
                              {modeLabels[m]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted">Average fps</p>
                        <p className="mt-1 flex items-baseline gap-2">
                          <Counter key={t.id} value={t.fpsAvg} decimals={1} className="font-display text-[44px] font-semibold leading-none" />
                          {t.targetFps && <span className="tabular text-sm text-muted">/ {t.targetFps}</span>}
                        </p>
                        <dl className="mt-5 space-y-0 text-[13px]">
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-start justify-between gap-3 border-t border-line py-2.5">
                              <dt className="text-muted">{r.label}</dt>
                              <dd className="tabular flex items-center gap-1.5 text-right">
                                {isBest(r, t) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" title="Best in comparison" />}
                                {r.get(t)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-3"><SourceBadge verified={t.verified} demo={t.demo} label={t.source.label} /></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <p className="flex items-center gap-2 text-[12px] text-muted md:hidden">Swipe to see every platform →</p>
            </div>
          )}

          {selTests.length > 0 && (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between"><p className="font-display text-lg font-semibold">Frame rate</p><span className="text-[11.5px] text-muted">solid = average · light = 1% low</span></div>
                <FpsBarChart tests={selTests} />
              </div>
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between"><p className="font-display text-lg font-semibold">Quality vs performance</p><span className="text-[11.5px] text-muted">0–100 per axis</span></div>
                <QualityRadar tests={selTests} />
              </div>
              <div className="card p-6 lg:col-span-2">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-semibold">Frametime over time</p>
                  <Pill tone="demo">Simulated trace from avg & 1% low</Pill>
                </div>
                <FrametimeChart tests={selTests} />
              </div>
              <div className="card p-6 lg:col-span-2">
                <p className="mb-4 font-display text-lg font-semibold">Visual comparison</p>
                <ImageCompare tests={selTests} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
