"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, Bookmark, Check, Cpu, Heart, LogOut, Plus, Trash2 } from "lucide-react";
import { estimateRun, type Build } from "@/lib/analysis";
import { modeLabels, platformById, platforms } from "@/lib/platforms";
import type { Mode, PlatformId, Submission } from "@/lib/types";
import type { DashData } from "@/lib/lite";
import { cn, formatDate, fmtFps } from "@/lib/utils";
import { BuildForm, ConfidenceMeter } from "./can-i-run";
import { useApp } from "./providers";
import { useMounted } from "@/lib/hooks";
import { EmptyState, GameCover, Pill, PlatformBadge, Skeleton } from "./ui";

function Panel({ title, icon, children, id, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-28 p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="text-gold-ink">{icon}</span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </section>
  );
}

export function Dashboard({ catalog }: { catalog: DashData }) {
  const { user, data, update, activeBuild, signOut } = useApp();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Build>({ gpu: "RTX 4070", cpu: "Ryzen 7 7700", ram: 32, resolution: 1440 });
  const mounted = useMounted();
  useEffect(() => {
    if (mounted && !user) router.replace("/login?next=/dashboard");
  }, [mounted, user, router]);

  const recsPc = useMemo(() => {
    if (!activeBuild) return [];
    return catalog.games
      .map((g) => ({ g, e: estimateRun(g, catalog.requirements.find((r) => r.gameSlug === g.slug), activeBuild) }))
      .filter((x) => x.e.fps !== null && x.e.fps >= 60 && x.e.ok)
      .sort((a, b) => (b.e.fps ?? 0) - (a.e.fps ?? 0))
      .slice(0, 6);
  }, [activeBuild, catalog]);

  const recsConsole = useMemo(() => {
    if (!data.consoles.length) return [];
    const best = new Map<string, (typeof catalog.consoleTests)[number]>();
    for (const t of catalog.consoleTests) {
      if (!data.consoles.includes(t.platform) || t.fpsAvg < 58.5) continue;
      const cur = best.get(t.gameSlug);
      if (!cur || t.nativePixels > cur.nativePixels) best.set(t.gameSlug, t);
    }
    return [...best.values()].sort((a, b) => b.nativePixels - a.nativePixels).slice(0, 6);
  }, [data.consoles, catalog]);

  if (!mounted || !user) return <div className="mx-auto max-w-7xl space-y-4 px-6"><Skeleton className="h-40" /><Skeleton className="h-72" /></div>;

  const favGames = catalog.games.filter((g) => data.favorites.includes(g.slug));
  const alertGames = catalog.games.filter((g) => data.alerts.includes(g.slug));

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Hello, {user.name.split(" ")[0]}.</h1>
          <p className="text-sm text-muted">{user.email} · {user.provider === "google" ? "Google (demo)" : "Email"}</p>
        </div>
        <Link href="/admin" className="hairline flex h-10 items-center rounded-full bg-card px-4 text-sm hover:shadow-soft">Admin panel</Link>
        <button onClick={signOut} className="hairline flex h-10 items-center gap-2 rounded-full bg-card px-4 text-sm hover:shadow-soft"><LogOut size={14} /> Sign out</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Saved PC builds" icon={<Cpu size={17} />} action={<button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 text-[13px] text-gold-ink hover:underline"><Plus size={14} /> Add build</button>}>
          {adding && (
            <div className="mb-5 rounded-2xl bg-surface p-4">
              <BuildForm build={draft} onChange={setDraft} />
              <button
                onClick={() => {
                  const id = crypto.randomUUID();
                  update((d) => ({ ...d, builds: [{ id, name: `${draft.gpu} · ${draft.cpu}`, ...draft }, ...d.builds], activeBuildId: id }));
                  setAdding(false);
                }}
                className="mt-4 h-10 rounded-full bg-ink px-5 text-sm text-bg"
              >Save build</button>
            </div>
          )}
          {data.builds.length === 0 ? (
            <p className="text-sm text-muted">No builds yet. Add one to get personal estimates and recommendations.</p>
          ) : (
            <ul className="space-y-2">
              {data.builds.map((b) => {
                const active = activeBuild?.id === b.id;
                return (
                  <li key={b.id} className={cn("hairline flex items-center gap-3 rounded-2xl p-3.5", active && "ring-1 ring-gold")}>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium">{b.gpu} <span className="text-muted">·</span> {b.cpu}</p>
                      <p className="tabular text-[12px] text-muted">{b.ram} GB RAM · {b.resolution === 2160 ? "4K" : `${b.resolution}p`}</p>
                    </div>
                    {active ? <Pill tone="gold">Active</Pill> : <button onClick={() => update((d) => ({ ...d, activeBuildId: b.id }))} className="text-[12.5px] text-muted hover:text-ink">Set active</button>}
                    <button onClick={() => update((d) => ({ ...d, builds: d.builds.filter((x) => x.id !== b.id) }))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label="Delete build"><Trash2 size={14} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="My consoles & handhelds" icon={<Check size={17} />}>
          <div className="flex flex-wrap gap-2">
            {platforms.filter((p) => p.family !== "pc").map((p) => {
              const on = data.consoles.includes(p.id);
              return (
                <button key={p.id} aria-pressed={on} onClick={() => update((d) => ({ ...d, consoles: on ? d.consoles.filter((x) => x !== p.id) : [...d.consoles, p.id] }))} className={cn("rounded-full transition", !on && "opacity-45 hover:opacity-80")}>
                  <PlatformBadge id={p.id} />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">Tap the platforms you own to personalise recommendations.</p>
        </Panel>
      </div>

      <section className="mt-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Games that run great on your setup</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <p className="mb-4 text-[12px] uppercase tracking-[0.14em] text-muted">On your PC{activeBuild ? ` · ${activeBuild.gpu}` : ""}</p>
            {!activeBuild ? <p className="text-sm text-muted">Save a PC build to see estimates.</p> : recsPc.length === 0 ? <p className="text-sm text-muted">No games are estimated at 60 fps+ for this build at {activeBuild.resolution}p. Try 1080p.</p> : (
              <ul className="space-y-2.5">
                {recsPc.map(({ g, e }) => (
                  <li key={g.slug}>
                    <Link href={`/can-i-run?game=${g.slug}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-surface">
                      <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-12 w-9 shrink-0 rounded-lg [&_p]:hidden" />
                      <span className="flex-1 text-[14px]">{g.title}</span>
                      <span className="tabular text-[13px]">~{e.fps} fps · {e.preset}</span>
                      <span className="hidden sm:block"><ConfidenceMeter c={e.confidence} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-6">
            <p className="mb-4 text-[12px] uppercase tracking-[0.14em] text-muted">On your consoles · 60 fps modes</p>
            {!data.consoles.length ? <p className="text-sm text-muted">Select the consoles you own above.</p> : recsConsole.length === 0 ? <p className="text-sm text-muted">No 60 fps entries for your consoles yet.</p> : (
              <ul className="space-y-2.5">
                {recsConsole.map((t) => {
                  const g = catalog.games.find((x) => x.slug === t.gameSlug)!;
                  return (
                    <li key={t.id}>
                      <Link href={`/compare?game=${g.slug}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-surface">
                        <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-12 w-9 shrink-0 rounded-lg [&_p]:hidden" />
                        <span className="flex-1 text-[14px]">{g.title}</span>
                        <PlatformBadge id={t.platform} size="xs" />
                        <span className="tabular text-[13px]">{fmtFps(t.fpsAvg)} fps · {t.nativeRes.replace(" (dynamic)", "")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Favorites" icon={<Heart size={17} />}>
          {favGames.length === 0 ? <p className="text-sm text-muted">Tap ♡ on any game page.</p> : (
            <ul className="space-y-2">{favGames.map((g) => <li key={g.slug}><Link className="hover:text-gold-ink" href={`/games/${g.slug}`}>{g.title}</Link></li>)}</ul>
          )}
        </Panel>
        <Panel title="Saved comparisons" icon={<Bookmark size={17} />}>
          {data.comparisons.length === 0 ? <p className="text-sm text-muted">Use “Save” in the Comparator.</p> : (
            <ul className="space-y-2.5">
              {data.comparisons.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <Link href={c.url} className="flex-1 text-[14px] hover:text-gold-ink">{c.title}<span className="block text-[11.5px] text-muted">{formatDate(c.createdAt.slice(0, 10))}</span></Link>
                  <button onClick={() => update((d) => ({ ...d, comparisons: d.comparisons.filter((x) => x.id !== c.id) }))} className="text-muted hover:text-ink" aria-label="Remove comparison"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Patch alerts" icon={<Bell size={17} />}>
          {alertGames.length === 0 ? <p className="text-sm text-muted">Turn on alerts from a game page to be notified when a performance patch drops.</p> : (
            <ul className="space-y-2">
              {alertGames.map((g) => (
                <li key={g.slug} className="flex items-center justify-between gap-2 text-[14px]">
                  <Link href={`/games/${g.slug}#patches`} className="hover:text-gold-ink">{g.title}</Link>
                  <span className="tabular text-[11.5px] text-muted">tracking {g.patch}</span>
                </li>
              ))}
            </ul>
          )}
          {alertGames.length > 0 && <p className="mt-4 text-[11.5px] text-muted">Alerts are recorded on this device; email delivery needs a backend job (see README).</p>}
        </Panel>
      </div>

      <SubmitBenchmark catalog={catalog} email={user.email} />
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-muted">{label}</span>{children}</label>;
}

function SubmitBenchmark({ catalog, email }: { catalog: DashData; email: string }) {
  const [f, setF] = useState({ gameSlug: catalog.games[0]?.slug ?? "", platform: "ps5" as PlatformId, mode: "performance" as Mode, targetFps: "60", fpsAvg: "", fps1Low: "", nativePixels: "1440", outputHeight: "2160", upscaler: "", quality: "High", rayTracing: false, loadSec: "", patchVersion: "", url: "", label: "" });
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [mine, setMine] = useState<Pick<Submission, "id" | "createdAt" | "status" | "test">[] | null>(null);
  const load = () => fetch(`/api/submissions?by=${encodeURIComponent(email)}`).then((r) => r.json()).then((j) => setMine(j.submissions));
  useEffect(() => { void load(); }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const field = "hairline h-10 w-full rounded-xl bg-card px-3 text-[13.5px]";
  const game = catalog.games.find((g) => g.slug === f.gameSlug);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const plat = platformById[f.platform];
    const fam = plat.family;
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submittedBy: email,
        test: {
          gameSlug: f.gameSlug, platform: f.platform, mode: f.mode,
          targetFps: f.targetFps ? Number(f.targetFps) : null,
          fpsAvg: Number(f.fpsAvg), fps1Low: Number(f.fps1Low),
          nativeRes: `${f.nativePixels}p`, nativePixels: Number(f.nativePixels), outputRes: `${f.outputHeight}p`,
          upscaler: f.upscaler || "Unknown", quality: f.quality, rayTracing: f.rayTracing,
          hdr: !["switch", "steam-deck"].includes(f.platform), vrr: fam === "pc" || ["ps5", "ps5-pro", "xbox-series-x", "xbox-series-s"].includes(f.platform),
          loadSec: Number(f.loadSec || 0), installGB: game?.installGB[fam] ?? 0, patchVersion: f.patchVersion || "unknown",
          source: { label: f.label || "Community submission", url: f.url },
          testedAt: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    const j = await res.json();
    setStatus(res.ok ? { ok: true, msg: "Submitted. It's now in the moderation queue." } : { ok: false, msg: j.error ?? "Could not submit." });
    if (res.ok) void load();
  };

  return (
    <section id="submit" className="card mt-6 scroll-mt-28 p-6">
      <h2 className="font-display text-lg font-semibold">Submit a benchmark</h2>
      <p className="mt-1 text-sm text-muted">Community figures enter a moderation queue and are published with your source link. A capture or video link is required.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <L label="Game"><select className={field} value={f.gameSlug} onChange={set("gameSlug")}>{catalog.games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}</select></L>
        <L label="Platform"><select className={field} value={f.platform} onChange={set("platform")}>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
        <L label="Mode"><select className={field} value={f.mode} onChange={set("mode")}>{Object.entries(modeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></L>
        <L label="Target fps (blank = uncapped)"><input className={field} inputMode="numeric" value={f.targetFps} onChange={set("targetFps")} /></L>
        <L label="Average fps"><input required className={field} inputMode="decimal" value={f.fpsAvg} onChange={set("fpsAvg")} /></L>
        <L label="1% low fps"><input required className={field} inputMode="decimal" value={f.fps1Low} onChange={set("fps1Low")} /></L>
        <L label="Internal res (height)"><input className={field} inputMode="numeric" value={f.nativePixels} onChange={set("nativePixels")} /></L>
        <L label="Output res (height)"><input className={field} inputMode="numeric" value={f.outputHeight} onChange={set("outputHeight")} /></L>
        <L label="Upscaler"><input className={field} placeholder="DLSS, FSR, PSSR…" value={f.upscaler} onChange={set("upscaler")} /></L>
        <L label="Quality"><select className={field} value={f.quality} onChange={set("quality")}>{["Low", "Medium", "High", "Ultra"].map((q) => <option key={q}>{q}</option>)}</select></L>
        <L label="Load time (s)"><input className={field} inputMode="decimal" value={f.loadSec} onChange={set("loadSec")} /></L>
        <L label="Patch version"><input className={field} value={f.patchVersion} onChange={set("patchVersion")} /></L>
        <L label="Source link (https)"><input required type="url" className={field} placeholder="https://…" value={f.url} onChange={set("url")} /></L>
        <L label="Source label"><input className={field} placeholder="e.g. My capture, YouTube" value={f.label} onChange={set("label")} /></L>
        <label className="flex items-center gap-2 self-end pb-2 text-[13.5px]"><input type="checkbox" checked={f.rayTracing} onChange={set("rayTracing")} className="accent-[var(--gold)]" /> Ray tracing on</label>
        <div className="flex items-end"><button className="h-10 w-full rounded-full bg-ink text-sm font-medium text-bg">Submit for review</button></div>
      </form>
      {status && <p role="status" className={cn("mt-4 text-[13px]", status.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>{status.msg}</p>}
      {mine && mine.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-muted">Your submissions</p>
          <ul className="space-y-2 text-[13.5px]">
            {mine.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3">
                <span>{catalog.games.find((g) => g.slug === s.test.gameSlug)?.title}</span>
                <PlatformBadge id={s.test.platform} size="xs" />
                <span className="tabular text-muted">{s.test.fpsAvg} fps</span>
                <Pill tone={s.status === "approved" ? "ok" : s.status === "rejected" ? "neutral" : "warn"}>{s.status}</Pill>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mine === null && <div className="mt-6"><Skeleton className="h-6 w-48" /></div>}
      {mine && mine.length === 0 && <div className="mt-6"><EmptyState title="No submissions yet" desc="Your submitted benchmarks and their review status will appear here." /></div>}
    </section>
  );
}
