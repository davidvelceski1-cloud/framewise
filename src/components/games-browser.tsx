"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, SlidersHorizontal, X } from "lucide-react";
import { applyNlFilters, parseNlQuery } from "@/lib/analysis";
import { platformById, platforms } from "@/lib/platforms";
import type { PlatformId } from "@/lib/types";
import type { BrowseData, LiteTest } from "@/lib/lite";
import { cn } from "@/lib/utils";
import { GameCover, EmptyState, PlatformBadge } from "./ui";
import Link from "next/link";
import { modeLabels } from "@/lib/platforms";

const PERF = {
  any: { label: "Any performance", test: () => true },
  "60-console": { label: "60 fps+ on console", test: (fam: string, fps: number) => fam !== "pc" && fam !== "steamdeck" && fps >= 58.5 },
  "60-handheld": { label: "60 fps+ on a handheld", test: (fam: string, fps: number, p: PlatformId) => ["steam-deck", "switch", "switch-2"].includes(p) && fps >= 58.5 },
  "30-deck": { label: "30 fps+ on Steam Deck", test: (_f: string, fps: number, p: PlatformId) => p === "steam-deck" && fps >= 29 },
  "120-pc": { label: "100 fps+ on PC", test: (fam: string, fps: number) => fam === "pc" && fps >= 100 },
} as const;

const PAGE = 24;

export function GamesBrowser({ catalog }: { catalog: BrowseData }) {
  const [limit, setLimit] = useState(PAGE);
  const testsByGame = useMemo(() => {
    const m = new Map<string, LiteTest[]>();
    for (const t of catalog.tests) (m.get(t.gameSlug) ?? m.set(t.gameSlug, []).get(t.gameSlug)!).push(t);
    return m;
  }, [catalog.tests]);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q") ?? "";
  // the input follows the URL query until the user edits it
  const [draftState, setDraftState] = useState({ q, v: q });
  const draft = draftState.q === q ? draftState.v : q;
  const setDraft = (v: string) => setDraftState({ q, v });
  const [plat, setPlat] = useState<PlatformId[]>([]);
  const [genre, setGenre] = useState("");
  const [publisher, setPublisher] = useState("");
  const [engine, setEngine] = useState("");
  const [year, setYear] = useState("");
  const [perf, setPerf] = useState<keyof typeof PERF>("any");
  const [sort, setSort] = useState<"title" | "newest" | "score">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const nl = useMemo(() => (q ? parseNlQuery(q, catalog) : null), [q, catalog]);
  const genres = [...new Set(catalog.games.flatMap((g) => g.genres))].sort();
  const pubs = catalog.publishers;
  const engines = [...new Set(catalog.games.map((g) => g.engine))].filter((e) => e !== "—").sort();
  const years = [...new Set(catalog.games.map((g) => g.releaseDate.slice(0, 4)))].sort().reverse();

  const results = useMemo(() => {
    let base = nl ? applyNlFilters(nl, catalog) : catalog.games.map((game) => ({ game, evidence: undefined as LiteTest | undefined }));
    // plain-text fallback if the NL parser found nothing structured
    if (nl && !nl.description.length) {
      const s = q.toLowerCase();
      base = catalog.games.filter((g) => g.title.toLowerCase().includes(s)).map((game) => ({ game, evidence: undefined as LiteTest | undefined }));
    }
    return base
      .filter(({ game }) => {
        const tests = testsByGame.get(game.slug) ?? [];
        if (plat.length && !plat.some((p) => tests.some((t) => t.platform === p))) return false;
        if (genre && !game.genres.includes(genre)) return false;
        if (publisher && !game.publishers.includes(publisher)) return false;
        if (engine && game.engine !== engine) return false;
        if (year && !game.releaseDate.startsWith(year)) return false;
        if (perf !== "any" && !tests.some((t) => PERF[perf].test(platformById[t.platform].family, t.fpsAvg, t.platform))) return false;
        return true;
      })
      .sort((a, b) =>
        sort === "title" ? a.game.title.localeCompare(b.game.title) : sort === "score" ? (b.game.criticScore ?? 0) - (a.game.criticScore ?? 0) : b.game.releaseDate.localeCompare(a.game.releaseDate),
      );
  }, [nl, catalog, testsByGame, q, plat, genre, publisher, engine, year, perf, sort]);

  const submit = (v: string) => router.replace(v.trim() ? `${pathname}?q=${encodeURIComponent(v.trim())}` : pathname, { scroll: false });
  const activeCount = plat.length + [genre, publisher, engine, year].filter(Boolean).length + (perf !== "any" ? 1 : 0);
  const clear = () => { setPlat([]); setGenre(""); setPublisher(""); setEngine(""); setYear(""); setPerf("any"); };
  const sel = "hairline h-10 w-full rounded-xl bg-card px-3 text-[13.5px]";

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className={cn("space-y-6 lg:block", showFilters ? "block" : "hidden")} aria-label="Filters">
        <div>
          <p className="mb-2.5 text-[11.5px] uppercase tracking-[0.14em] text-muted">Platform</p>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => {
              const on = plat.includes(p.id);
              return (
                <button key={p.id} onClick={() => setPlat(on ? plat.filter((x) => x !== p.id) : [...plat, p.id])} aria-pressed={on} className={cn("rounded-full transition", !on && "opacity-55 hover:opacity-90")}>
                  <PlatformBadge id={p.id} />
                </button>
              );
            })}
          </div>
        </div>
        <label className="block"><span className="mb-2 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Performance</span>
          <select className={sel} value={perf} onChange={(e) => setPerf(e.target.value as keyof typeof PERF)}>{Object.entries(PERF).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        </label>
        <label className="block"><span className="mb-2 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Genre</span>
          <select className={sel} value={genre} onChange={(e) => setGenre(e.target.value)}><option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <label className="block"><span className="mb-2 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Publisher</span>
          <select className={sel} value={publisher} onChange={(e) => setPublisher(e.target.value)}><option value="">All publishers</option>{pubs.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select>
        </label>
        <label className="block"><span className="mb-2 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Release year</span>
          <select className={sel} value={year} onChange={(e) => setYear(e.target.value)}><option value="">Any year</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <label className="block"><span className="mb-2 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Engine</span>
          <select className={sel} value={engine} onChange={(e) => setEngine(e.target.value)}><option value="">Any engine</option>{engines.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        {activeCount > 0 && <button onClick={clear} className="text-[13px] text-gold-ink hover:underline">Clear {activeCount} filter{activeCount > 1 ? "s" : ""}</button>}
      </aside>

      <div>
        <form onSubmit={(e) => { e.preventDefault(); submit(draft); }} className="glass hairline flex items-center gap-3 rounded-2xl p-1.5 pl-4 shadow-soft" role="search">
          <Sparkles size={16} className="text-gold-ink" />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Try “open-world games over 60 fps on Steam Deck”" className="h-10 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted" aria-label="Natural-language game search" />
          {q && <button type="button" onClick={() => { setDraft(""); submit(""); }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface" aria-label="Clear search"><X size={15} /></button>}
          <button className="h-10 rounded-xl bg-ink px-4 text-[13.5px] font-medium text-bg">Search</button>
        </form>
        {nl && nl.description.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            Understood as: {nl.description.map((d) => <span key={d} className="hairline rounded-full bg-card px-2.5 py-0.5 text-ink">{d}</span>)}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[13.5px] text-muted" role="status"><span className="tabular text-ink">{results.length}</span> game{results.length === 1 ? "" : "s"}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters((v) => !v)} className="hairline flex h-9 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] lg:hidden"><SlidersHorizontal size={14} /> Filters{activeCount ? ` (${activeCount})` : ""}</button>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="hairline h-9 rounded-full bg-card px-3 text-[13px]" aria-label="Sort by">
              <option value="newest">Newest</option>
              <option value="title">A–Z</option>
              <option value="score">Critic score</option>
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-6"><EmptyState title="No games match" desc="Try removing a filter or rephrasing your search." action={<button onClick={() => { clear(); setDraft(""); submit(""); }} className="text-sm text-gold-ink hover:underline">Reset everything</button>} /></div>
        ) : (
          <motion.div layout className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, limit).map(({ game, evidence }) => {
              const tests = testsByGame.get(game.slug) ?? [];
              const plats = [...new Set(tests.map((t) => t.platform))];
              return (
                <motion.div layout key={game.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Link href={`/games/${game.slug}`} className="card lift block p-2.5">
                    <GameCover title={game.title} cover={game.cover} image={game.coverUrl} className="aspect-[16/10] w-full" />
                    <div className="px-2 pb-2 pt-4">
                      <p className="font-display text-[17px] font-semibold">{game.title}</p>
                      <p className="text-[12.5px] text-muted">{game.releaseDate.slice(0, 4)} · {game.genres.join(" · ")}{game.engine !== "—" ? ` · ${game.engine}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-1">{plats.slice(0, 5).map((p) => <PlatformBadge key={p} id={p} size="xs" />)}{plats.length > 5 && <span className="text-[11px] text-muted">+{plats.length - 5}</span>}</div>
                      {evidence && (
                        <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
                          Match: <span className="tabular text-ink">{evidence.fpsAvg.toFixed(0)} fps</span> on {platformById[evidence.platform].short} ({modeLabels[evidence.mode]})
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        {results.length > limit && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <button onClick={() => setLimit((l) => l + PAGE * 2)} className="hairline h-11 rounded-full bg-card px-6 text-sm font-medium hover:shadow-soft">
              Show more games
            </button>
            <p className="tabular text-[12px] text-muted">Showing {limit} of {results.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}
