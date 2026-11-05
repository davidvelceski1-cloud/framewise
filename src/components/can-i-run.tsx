"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Save } from "lucide-react";
import { estimateRun, type Build, type RunEstimate } from "@/lib/analysis";
import { cpus, gpus } from "@/lib/data/hardware";
import type { PcRequirements } from "@/lib/types";
import type { RunGame } from "@/lib/lite";
import { cn } from "@/lib/utils";
import { useApp } from "./providers";
import { GameCover, Pill } from "./ui";

const verdictTone: Record<RunEstimate["verdict"], string> = {
  "Exceeds recommended": "text-emerald-700 dark:text-emerald-300",
  "Meets recommended": "text-emerald-700 dark:text-emerald-300",
  "Meets minimum": "text-amber-700 dark:text-amber-300",
  "Below minimum": "text-red-700 dark:text-red-300",
  Unsupported: "text-muted",
  "Unknown hardware": "text-muted",
};

export function ConfidenceMeter({ c }: { c: RunEstimate["confidence"] }) {
  const n = c === "High" ? 3 : c === "Medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted" title={`${c} confidence`}>
      <span className="flex gap-0.5" aria-hidden>{[1, 2, 3].map((i) => <span key={i} className={cn("h-2.5 w-1.5 rounded-sm", i <= n ? "bg-gold" : "bg-line-strong")} />)}</span>
      {c} confidence
    </span>
  );
}

export function BuildForm({ build, onChange }: { build: Build; onChange: (b: Build) => void }) {
  const field = "hairline h-11 w-full rounded-xl bg-card px-3.5 text-[14px]";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Graphics card</span>
        <input list="gpu-list" className={field} value={build.gpu} onChange={(e) => onChange({ ...build, gpu: e.target.value })} placeholder="e.g. RTX 3060" />
        <datalist id="gpu-list">{gpus.map((g) => <option key={g.name} value={g.name} />)}</datalist>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Processor</span>
        <input list="cpu-list" className={field} value={build.cpu} onChange={(e) => onChange({ ...build, cpu: e.target.value })} placeholder="e.g. Ryzen 5 5600" />
        <datalist id="cpu-list">{cpus.map((c) => <option key={c.name} value={c.name} />)}</datalist>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Memory</span>
        <select className={field} value={build.ram} onChange={(e) => onChange({ ...build, ram: Number(e.target.value) })}>
          {[8, 12, 16, 24, 32, 64].map((r) => <option key={r} value={r}>{r} GB</option>)}
        </select>
      </label>
      <div>
        <span className="mb-1.5 block text-[11.5px] uppercase tracking-[0.14em] text-muted">Target resolution</span>
        <div className="hairline flex h-11 rounded-xl bg-card p-1" role="radiogroup" aria-label="Target resolution">
          {([1080, 1440, 2160] as const).map((r) => (
            <button key={r} role="radio" aria-checked={build.resolution === r} onClick={() => onChange({ ...build, resolution: r })} className={cn("flex-1 rounded-lg text-[13px] transition", build.resolution === r ? "bg-ink text-bg" : "text-muted hover:text-ink")}>
              {r === 2160 ? "4K" : `${r}p`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CanIRun({ games, requirements }: { games: RunGame[]; requirements: PcRequirements[] }) {
  const [limit, setLimit] = useState(30);
  const params = useSearchParams();
  const focus = params.get("game");
  const { activeBuild, user, update } = useApp();
  const router = useRouter();
  // The form follows the saved active build until the user edits it.
  const [edited, setBuild] = useState<Build | null>(null);
  const build = useMemo<Build>(
    () => edited ?? (activeBuild ? { gpu: activeBuild.gpu, cpu: activeBuild.cpu, ram: activeBuild.ram, resolution: activeBuild.resolution } : { gpu: "RTX 3060", cpu: "Ryzen 5 5600", ram: 16, resolution: 1080 }),
    [edited, activeBuild],
  );
  const [saved, setSaved] = useState(false);

  const results = useMemo(() => {
    const r = games.map((g) => ({ g, e: estimateRun(g, requirements.find((x) => x.gameSlug === g.slug), build) }));
    const rank = (e: RunEstimate) => (e.verdict === "Unsupported" ? -1 : e.fps ?? 0);
    return r.sort((a, b) => (a.g.slug === focus ? -1 : b.g.slug === focus ? 1 : rank(b.e) - rank(a.e)));
  }, [games, requirements, build, focus]);

  const save = () => {
    if (!user) return router.push("/login?next=/can-i-run");
    const id = crypto.randomUUID();
    update((d) => ({ ...d, builds: [{ id, name: `${build.gpu} · ${build.cpu}`, ...build }, ...d.builds], activeBuildId: id }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const focused = focus ? results.find((r) => r.g.slug === focus) : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <p className="font-display text-lg font-semibold">Your PC</p>
          <p className="mb-5 text-[13px] text-muted">Estimates scale from each game&apos;s published requirements using our hardware index.</p>
          <BuildForm build={build} onChange={setBuild} />
          <button onClick={save} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-bg">
            {saved ? <><Check size={15} /> Saved as active build</> : <><Save size={15} /> {user ? "Save this build" : "Sign in to save this build"}</>}
          </button>
        </div>
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted">
          These are estimates, not benchmarks. Confidence drops when your hardware is far from the reference GPU, when the CPU isn&apos;t in our index, or when you target a different resolution than the published spec.
        </p>
      </div>

      <div className="space-y-4">
        {focused && focused.e.fps !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-7">
            <div className="gold-gradient absolute inset-x-0 top-0 h-1" />
            <div className="flex flex-wrap items-start gap-6">
              <GameCover title={focused.g.title} cover={focused.g.cover} image={focused.g.coverUrl} size="sm" className="aspect-[3/4] w-24" />
              <div className="flex-1">
                <p className={cn("text-[13px] font-medium", verdictTone[focused.e.verdict])}>{focused.e.verdict}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{focused.g.title}</h2>
                <p className="mt-3 flex items-baseline gap-2"><span className="tabular font-display text-5xl font-semibold">~{focused.e.fps}</span><span className="text-muted">fps · {focused.e.preset} · {build.resolution === 2160 ? "4K" : `${build.resolution}p`}</span></p>
                <div className="mt-3"><ConfidenceMeter c={focused.e.confidence} /></div>
                {focused.e.byPreset && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["Ultra", "High", "Medium", "Low"] as const).map((p) => (
                      <span key={p} className={cn("hairline tabular rounded-full px-3 py-1 text-[12px]", p === focused.e.preset ? "bg-ink text-bg" : "bg-card text-muted")}>
                        {p} ~{focused.e.byPreset![p]} fps
                      </span>
                    ))}
                  </div>
                )}
                {focused.e.notes.length > 0 && <ul className="mt-4 space-y-1 text-[13px] text-muted">{focused.e.notes.map((n) => <li key={n}>· {n}</li>)}</ul>}
              </div>
            </div>
          </motion.div>
        )}
        <div className="card divide-y divide-line">
          {results.slice(0, limit).map(({ g, e }) => (
            <div key={g.slug} className={cn("flex flex-wrap items-center gap-4 p-4", g.slug === focus && "bg-surface/60")}>
              <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-14 w-11 shrink-0 rounded-xl [&_p]:hidden" />
              <div className="min-w-[180px] flex-1">
                <Link href={`/games/${g.slug}#specs`} className="font-medium hover:text-gold-ink">{g.title}</Link>
                <p className={cn("text-[12.5px]", verdictTone[e.verdict])}>{e.verdict}</p>
              </div>
              {e.fps !== null ? (
                <>
                  <div className="w-24 text-right"><p className="tabular font-display text-xl font-semibold">~{e.fps}</p><p className="text-[11px] text-muted">fps</p></div>
                  <Pill>{e.preset}</Pill>
                  <div className="w-36"><ConfidenceMeter c={e.confidence} /></div>
                </>
              ) : (
                <p className="max-w-xs text-[12.5px] text-muted">{e.notes[0]}</p>
              )}
            </div>
          ))}
        </div>
        {results.length > limit && (
          <button onClick={() => setLimit((l) => l + 60)} className="hairline mx-auto block h-11 rounded-full bg-card px-6 text-sm font-medium hover:shadow-soft">
            Show more games ({results.length - limit} more)
          </button>
        )}
      </div>
    </div>
  );
}
