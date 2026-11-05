"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { modeLabels, platforms, releasePlatformMeta } from "@/lib/platforms";
import type { Catalog, Game, Mode, PcRequirements, PerformanceTest, PlatformId, ReleasePlatform, ReqTier, Submission } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { useApp } from "./providers";
import { EmptyState, Pill, PlatformBadge, SourceBadge } from "./ui";

/* ───────── API helper ───────── */
function useAdminApi() {
  const router = useRouter();
  // Admin views only render client-side after sign-in, so reading sessionStorage lazily is safe.
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : sessionStorage.getItem("fw:admin-token") ?? ""));
  const call = async (method: string, url: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { "content-type": "application/json", "x-admin-token": token }, body: body ? JSON.stringify(body) : undefined });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`);
    router.refresh();
    return j;
  };
  return { call, token, setToken: (t: string) => { sessionStorage.setItem("fw:admin-token", t); setToken(t); } };
}

const FLAG_LABELS = { rayTracing: "RT", hdr: "HDR", vrr: "VRR", verified: "Verified", demo: "Demo" } as const;
const field = "hairline h-10 w-full rounded-xl bg-card px-3 text-[13.5px]";
function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("block", className)}><span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-muted">{label}</span>{children}</label>;
}

/* ───────── Game editor (incl. credits) ───────── */
function blankGame(): Game {
  return {
    slug: "", title: "", tagline: "", summary: "", releaseDate: new Date().toISOString().slice(0, 10), genres: [], tags: [], developers: [], publishers: [],
    credits: {}, engine: "", releases: [], installGB: {}, cover: ["#141024", "#C9A96E", "#3B2A5C"], patches: [], benchmarked: [],
    profile: { load: 1, modes: ["performance", "quality"], rt: false, rtConsole: false, consoleUpscaler: "", pcUpscaler: "", proEnhanced: false, loadBase: 10, patch: "1.0" },
  };
}

function GameEditor({ initial, catalog, onDone }: { initial: Game; catalog: Catalog; onDone: () => void }) {
  const { call } = useAdminApi();
  const isNew = !initial.slug;
  const [g, setG] = useState<Game>(initial);
  const [releases, setReleases] = useState(initial.releases.map((r) => [r.platform, r.date, r.edition ?? ""].join(", ")).join("\n"));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const save = async () => {
    setErr(null);
    setBusy(true);
    try {
      const rel = releases.split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((x) => x[0]).map(([platform, date, edition]) => {
        if (!(platform in releasePlatformMeta)) throw new Error(`Unknown release platform "${platform}". Use: ${Object.keys(releasePlatformMeta).join(", ")}`);
        return { platform: platform as ReleasePlatform, date, ...(edition ? { edition } : {}) };
      });
      const slug = isNew ? slugify(g.title) : g.slug;
      await call("POST", "/api/admin/games", { ...g, slug, releases: rel });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const studioOpts = catalog.studios.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>);
  const multi = (k: "developers" | "publishers") => (
    <select multiple className="hairline h-28 w-full rounded-xl bg-card px-2 py-1 text-[13px]" value={g[k]} onChange={(e) => setG({ ...g, [k]: [...e.target.selectedOptions].map((o) => o.value) })}>{studioOpts}</select>
  );

  return (
    <div className="card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{isNew ? "New game" : `Edit ${initial.title}`}</h3>
        <button onClick={onDone} className="text-[13px] text-muted hover:text-ink">Cancel</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <F label="Title"><input className={field} value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} /></F>
        <F label="Release date"><input type="date" className={field} value={g.releaseDate} onChange={(e) => setG({ ...g, releaseDate: e.target.value })} /></F>
        <F label="Engine"><input className={field} value={g.engine} onChange={(e) => setG({ ...g, engine: e.target.value })} /></F>
        <F label="Tagline" className="md:col-span-3"><input className={field} value={g.tagline} onChange={(e) => setG({ ...g, tagline: e.target.value })} /></F>
        <F label="Summary" className="md:col-span-3"><textarea className="hairline min-h-24 w-full rounded-xl bg-card p-3 text-[13.5px]" value={g.summary} onChange={(e) => setG({ ...g, summary: e.target.value })} /></F>
        <F label="Genres (comma separated)"><input className={field} defaultValue={g.genres.join(", ")} onBlur={(e) => setG({ ...g, genres: list(e.target.value) })} /></F>
        <F label="Tags (comma separated)"><input className={field} defaultValue={g.tags.join(", ")} onBlur={(e) => setG({ ...g, tags: list(e.target.value) })} /></F>
        <F label="Cover image URL (IGDB, https, or /covers/file.jpg)" className="md:col-span-2"><input className={field} value={g.coverUrl ?? ""} onChange={(e) => setG({ ...g, coverUrl: e.target.value || undefined })} placeholder="https://images.igdb.com/igdb/image/upload/t_cover_big_2x/….jpg" /></F>
        <F label="Critic score"><input className={field} inputMode="numeric" value={g.criticScore ?? ""} onChange={(e) => setG({ ...g, criticScore: e.target.value ? Number(e.target.value) : undefined })} /></F>
      </div>
      <div>
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-gold-ink">Credits</p>
        <div className="grid gap-4 md:grid-cols-4">
          {(["director", "leadWriter", "composer", "producer"] as const).map((k) => (
            <F key={k} label={k === "leadWriter" ? "Lead writer" : k[0].toUpperCase() + k.slice(1)}>
              <input className={field} value={g.credits[k] ?? ""} onChange={(e) => setG({ ...g, credits: { ...g.credits, [k]: e.target.value || undefined } })} />
            </F>
          ))}
          <F label="Developers" className="md:col-span-2">{multi("developers")}</F>
          <F label="Publishers" className="md:col-span-2">{multi("publishers")}</F>
        </div>
      </div>
      <F label="Releases — one per line: platform, YYYY-MM-DD, edition (optional)">
        <textarea className="hairline tabular min-h-28 w-full rounded-xl bg-card p-3 text-[12.5px]" value={releases} onChange={(e) => setReleases(e.target.value)} placeholder="ps5, 2025-05-15, PS5 Pro Enhanced" />
      </F>
      <F label="Benchmarked platforms">
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((p) => {
            const on = g.benchmarked.includes(p.id);
            return <button type="button" key={p.id} onClick={() => setG({ ...g, benchmarked: on ? g.benchmarked.filter((x) => x !== p.id) : [...g.benchmarked, p.id] })} className={cn(!on && "opacity-40")} aria-pressed={on}><PlatformBadge id={p.id} size="xs" /></button>;
          })}
        </div>
      </F>
      {err && <p className="text-[13px] text-red-700 dark:text-red-300" role="alert">{err}</p>}
      <button disabled={busy || !g.title} onClick={save} className="h-10 rounded-full bg-ink px-6 text-sm font-medium text-bg disabled:opacity-40">{busy ? "Saving…" : "Save game"}</button>
    </div>
  );
}

/* ───────── Requirements (specs) editor ───────── */
const emptyTier = (): ReqTier => ({ cpu: "", gpu: "", ram: 16, vram: 8, storage: "", os: "Windows 10/11 64-bit", api: "DirectX 12", target: "" });

function SpecsEditor({ catalog }: { catalog: Catalog }) {
  const [slug, setSlug] = useState(catalog.games[0]?.slug ?? "");
  // keyed by slug: switching games mounts a fresh form seeded from that game's specs
  return <SpecsForm key={slug} slug={slug} setSlug={setSlug} catalog={catalog} />;
}

function SpecsForm({ slug, setSlug, catalog }: { slug: string; setSlug: (s: string) => void; catalog: Catalog }) {
  const { call } = useAdminApi();
  const pcGames = catalog.games;
  const [r, setR] = useState<PcRequirements>(() => {
    const current = catalog.requirements.find((x) => x.gameSlug === slug);
    return current ? structuredClone(current) : { gameSlug: slug, minimum: emptyTier(), recommended: emptyTier(), refs: { minGpu: "GTX 1060 6GB", recGpu: "RTX 3060", minCpu: "Core i5-8400", recCpu: "Ryzen 5 3600" }, source: "Publisher store listing" };
  });
  const [msg, setMsg] = useState<string | null>(null);
  const tierFields = (key: "minimum" | "recommended" | "ultra") => {
    const t = r[key];
    if (!t) return <button onClick={() => setR({ ...r, ultra: emptyTier() })} className="hairline h-full min-h-40 w-full rounded-2xl border-dashed text-sm text-muted hover:text-ink">+ Add Ultra / 4K tier</button>;
    const upd = (k: keyof ReqTier, v: string) => setR({ ...r, [key]: { ...t, [k]: k === "ram" || k === "vram" ? Number(v) : v } });
    return (
      <div className="space-y-3 rounded-2xl bg-surface p-4">
        <p className="font-medium capitalize">{key === "ultra" ? "Ultra / 4K" : key}</p>
        {(["cpu", "gpu", "ram", "vram", "storage", "os", "api", "target"] as const).map((k) => (
          <F key={k} label={k.toUpperCase()}><input className={field} value={t[k]} onChange={(e) => upd(k, e.target.value)} /></F>
        ))}
        {key === "ultra" && <button onClick={() => { const { ultra: _u, ...rest } = r; void _u; setR(rest); }} className="text-[12.5px] text-muted hover:text-ink">Remove tier</button>}
      </div>
    );
  };
  return (
    <div className="card space-y-5 p-6">
      <div className="flex flex-wrap items-end gap-4">
        <F label="Game" className="w-72"><select className={field} value={slug} onChange={(e) => setSlug(e.target.value)}>{pcGames.map((g) => <option key={g.slug} value={g.slug}>{g.title}{catalog.requirements.some((x) => x.gameSlug === g.slug) ? "" : " (no PC specs)"}</option>)}</select></F>
        <F label="Source" className="flex-1"><input className={field} value={r.source} onChange={(e) => setR({ ...r, source: e.target.value })} /></F>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">{tierFields("minimum")}{tierFields("recommended")}{tierFields("ultra")}</div>
      <div className="grid gap-4 md:grid-cols-4">
        {(["minGpu", "recGpu", "minCpu", "recCpu"] as const).map((k) => (
          <F key={k} label={`Estimator ref · ${k}`}><input className={field} value={r.refs[k]} onChange={(e) => setR({ ...r, refs: { ...r.refs, [k]: e.target.value } })} /></F>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={async () => { try { await call("POST", "/api/admin/requirements", r); setMsg("Saved."); } catch (e) { setMsg((e as Error).message); } }} className="h-10 rounded-full bg-ink px-6 text-sm font-medium text-bg">Save specs</button>
        {msg && <span className="text-[13px] text-muted" role="status">{msg}</span>}
      </div>
    </div>
  );
}

/* ───────── Performance entries ───────── */
function blankTest(gameSlug: string): PerformanceTest {
  return { id: "", gameSlug, platform: "ps5", mode: "performance", targetFps: 60, fpsAvg: 60, fps1Low: 50, nativeRes: "1440p (dynamic)", nativePixels: 1440, outputRes: "2160p", upscaler: "", quality: "High", rayTracing: false, hdr: true, vrr: true, loadSec: 10, installGB: 50, patchVersion: "1.0", source: { label: "", url: "" }, verified: false, demo: false, testedAt: new Date().toISOString().slice(0, 10) };
}

function TestEditor({ initial, onDone }: { initial: PerformanceTest; onDone: () => void }) {
  const { call } = useAdminApi();
  const [t, setT] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const n = (k: keyof PerformanceTest) => (e: React.ChangeEvent<HTMLInputElement>) => setT({ ...t, [k]: e.target.value === "" ? null : Number(e.target.value) });
  const s = (k: keyof PerformanceTest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setT({ ...t, [k]: e.target.value });
  return (
    <div className="space-y-4 rounded-2xl bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <F label="Platform"><select className={field} value={t.platform} onChange={(e) => setT({ ...t, platform: e.target.value as PlatformId })}>{platforms.map((p) => <option key={p.id} value={p.id}>{p.short}</option>)}</select></F>
        <F label="Mode"><select className={field} value={t.mode} onChange={(e) => setT({ ...t, mode: e.target.value as Mode })}>{Object.entries(modeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
        <F label="Target fps"><input className={field} value={t.targetFps ?? ""} onChange={n("targetFps")} placeholder="uncapped" /></F>
        <F label="Avg fps"><input className={field} value={t.fpsAvg} onChange={n("fpsAvg")} /></F>
        <F label="1% low"><input className={field} value={t.fps1Low} onChange={n("fps1Low")} /></F>
        <F label="Quality"><select className={field} value={t.quality} onChange={s("quality")}>{["Low", "Medium", "High", "Ultra"].map((q) => <option key={q}>{q}</option>)}</select></F>
        <F label="Native res label"><input className={field} value={t.nativeRes} onChange={s("nativeRes")} /></F>
        <F label="Native height px"><input className={field} value={t.nativePixels} onChange={n("nativePixels")} /></F>
        <F label="Output res"><input className={field} value={t.outputRes} onChange={s("outputRes")} /></F>
        <F label="Upscaler"><input className={field} value={t.upscaler} onChange={s("upscaler")} /></F>
        <F label="Load (s)"><input className={field} value={t.loadSec} onChange={n("loadSec")} /></F>
        <F label="Install GB"><input className={field} value={t.installGB} onChange={n("installGB")} /></F>
        <F label="Patch"><input className={field} value={t.patchVersion} onChange={s("patchVersion")} /></F>
        <F label="Source label"><input className={field} value={t.source.label} onChange={(e) => setT({ ...t, source: { ...t.source, label: e.target.value } })} /></F>
        <F label="Source URL" className="sm:col-span-2"><input className={field} value={t.source.url ?? ""} onChange={(e) => setT({ ...t, source: { ...t.source, url: e.target.value || undefined } })} placeholder="https://" /></F>
        <div className="flex flex-wrap items-end gap-4 pb-2 text-[13px] sm:col-span-2">
          {(["rayTracing", "hdr", "vrr", "verified", "demo"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" className="accent-[var(--gold)]" checked={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.checked })} />{FLAG_LABELS[k]}</label>
          ))}
        </div>
      </div>
      {err && <p className="text-[13px] text-red-700 dark:text-red-300" role="alert">{err}</p>}
      <div className="flex gap-3">
        <button onClick={async () => { setErr(null); try { await call("POST", "/api/admin/tests", t); onDone(); } catch (e) { setErr((e as Error).message); } }} className="h-9 rounded-full bg-ink px-5 text-[13px] text-bg">Save entry</button>
        <button onClick={onDone} className="text-[13px] text-muted">Cancel</button>
      </div>
    </div>
  );
}

function PerfAdmin({ catalog }: { catalog: Catalog }) {
  const { call } = useAdminApi();
  const [slug, setSlug] = useState(catalog.games[0]?.slug ?? "");
  const [editing, setEditing] = useState<string | null>(null);
  const tests = catalog.tests.filter((t) => t.gameSlug === slug).sort((a, b) => a.platform.localeCompare(b.platform));
  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <F label="Game" className="w-72"><select className={field} value={slug} onChange={(e) => { setSlug(e.target.value); setEditing(null); }}>{catalog.games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}</select></F>
        <button onClick={() => setEditing("new")} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] text-bg"><Plus size={14} /> Add entry</button>
        <p className="ml-auto text-[12.5px] text-muted">{tests.length} entries</p>
      </div>
      {editing === "new" && <div className="mb-4"><TestEditor initial={blankTest(slug)} onDone={() => setEditing(null)} /></div>}
      <ul className="divide-y divide-line">
        {tests.map((t) => (
          <li key={t.id} className="py-3">
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <PlatformBadge id={t.platform} size="xs" />
              <span className="w-24">{modeLabels[t.mode]}</span>
              <span className="tabular w-28">{t.fpsAvg} / {t.fps1Low} fps</span>
              <span className="tabular w-40 text-muted">{t.nativeRes}</span>
              <SourceBadge verified={t.verified} demo={t.demo} label={t.source.label} />
              <div className="ml-auto flex gap-1">
                {!t.verified && <button title="Mark verified" onClick={() => call("POST", "/api/admin/tests", { ...t, verified: true, demo: false })} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-emerald-700"><ShieldCheck size={15} /></button>}
                <button title="Edit" onClick={() => setEditing(editing === t.id ? null : t.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"><Pencil size={14} /></button>
                <button title="Delete" onClick={() => confirm("Delete this entry?") && call("DELETE", `/api/admin/tests?id=${encodeURIComponent(t.id)}`)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            </div>
            {editing === t.id && <div className="mt-3"><TestEditor initial={t} onDone={() => setEditing(null)} /></div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────── Moderation queue ───────── */
function Moderation({ catalog }: { catalog: Catalog }) {
  const { call, token } = useAdminApi();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () =>
    fetch("/api/admin/submissions", { headers: { "x-admin-token": token } })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setSubs(j.submissions); })
      .catch((e) => setErr(e.message));
  useEffect(() => { void load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (id: string, action: "approve" | "reject", verify = false) => {
    await call("POST", "/api/admin/submissions", { id, action, verify });
    void load();
  };
  if (err) return <EmptyState title="Can't load the queue" desc={err} />;
  if (!subs) return <div className="shimmer h-40 rounded-2xl" />;
  const pending = subs.filter((s) => s.status === "pending");
  return (
    <div className="space-y-4">
      {pending.length === 0 ? <EmptyState title="Queue is clear" desc="New community benchmarks will appear here for review." /> : pending.map((s) => (
        <div key={s.id} className="card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-medium">{catalog.games.find((g) => g.slug === s.test.gameSlug)?.title ?? s.test.gameSlug}</p>
            <PlatformBadge id={s.test.platform} size="xs" />
            <Pill>{modeLabels[s.test.mode]}</Pill>
            <span className="ml-auto text-[12px] text-muted">by {s.submittedBy} · {new Date(s.createdAt).toLocaleString()}</span>
          </div>
          <p className="tabular mt-3 text-[13px]">{s.test.fpsAvg} fps avg · {s.test.fps1Low} 1% low · target {s.test.targetFps ?? "uncapped"} · {s.test.nativeRes} → {s.test.outputRes} · {s.test.upscaler} · {s.test.quality} · RT {s.test.rayTracing ? "on" : "off"} · patch {s.test.patchVersion}</p>
          {(() => {
            const ref = catalog.tests.find((t) => t.gameSlug === s.test.gameSlug && t.platform === s.test.platform && t.mode === s.test.mode);
            return ref ? <p className="mt-1 text-[12px] text-muted">Existing entry: {ref.fpsAvg} fps at {ref.nativeRes} ({ref.demo ? "demo" : ref.verified ? "verified" : "unverified"}) · Δ {(s.test.fpsAvg - ref.fpsAvg).toFixed(1)} fps</p> : <p className="mt-1 text-[12px] text-muted">No existing entry for this platform/mode.</p>;
          })()}
          <a href={s.test.source.url} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-[12.5px] text-gold-ink underline-offset-2 hover:underline">{s.test.source.label} ↗</a>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => act(s.id, "approve", true)} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] text-bg"><ShieldCheck size={14} /> Approve as verified</button>
            <button onClick={() => act(s.id, "approve")} className="hairline flex h-9 items-center gap-1.5 rounded-full bg-card px-4 text-[13px]"><CheckCircle2 size={14} /> Approve (unverified)</button>
            <button onClick={() => act(s.id, "reject")} className="hairline flex h-9 items-center gap-1.5 rounded-full bg-card px-4 text-[13px] text-red-700 dark:text-red-300"><XCircle size={14} /> Reject</button>
          </div>
        </div>
      ))}
      {subs.length > pending.length && <p className="text-[12.5px] text-muted">{subs.length - pending.length} reviewed submission(s) in history.</p>}
    </div>
  );
}

/* ───────── Shell ───────── */
export function AdminPanel({ catalog, tokenRequired }: { catalog: Catalog; tokenRequired: boolean }) {
  const { user } = useApp();
  const { call, token, setToken } = useAdminApi();
  const [tab, setTab] = useState<"games" | "specs" | "perf" | "queue">("games");
  const [editing, setEditing] = useState<Game | null>(null);
  const [q, setQ] = useState("");
  const games = useMemo(() => catalog.games.filter((g) => g.title.toLowerCase().includes(q.toLowerCase())), [catalog.games, q]);
  const stats = {
    games: catalog.games.length,
    entries: catalog.tests.length,
    verified: catalog.tests.filter((t) => t.verified).length,
    demo: catalog.tests.filter((t) => t.demo).length,
  };

  if (!user) return <EmptyState title="Sign in required" desc="The admin panel is available to signed-in accounts." action={<a href="/login?next=/admin" className="text-sm text-gold-ink hover:underline">Sign in →</a>} />;

  return (
    <div>
      {tokenRequired && (
        <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
          <ShieldCheck size={16} className="text-gold-ink" />
          <span className="text-[13.5px]">This server requires an admin token.</span>
          <input type="password" className={cn(field, "w-64")} placeholder="ADMIN_TOKEN" defaultValue={token} onBlur={(e) => setToken(e.target.value)} aria-label="Admin token" />
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[["Games", stats.games], ["Performance entries", stats.entries], ["Verified", stats.verified], ["Demo entries", stats.demo]].map(([l, v]) => (
          <div key={l as string} className="card p-5"><p className="tabular font-display text-3xl font-semibold">{v}</p><p className="text-[12.5px] text-muted">{l}</p></div>
        ))}
      </div>
      <div role="tablist" className="hairline mb-6 flex w-fit flex-wrap gap-1 rounded-full bg-card p-1">
        {([["games", "Games & credits"], ["specs", "PC specs"], ["perf", "Performance entries"], ["queue", "Moderation queue"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("h-9 rounded-full px-4 text-[13.5px]", tab === id ? "bg-ink text-bg" : "text-muted hover:text-ink")}>{label}</button>
        ))}
      </div>

      {tab === "games" && (
        editing ? <GameEditor key={editing.slug || "new"} initial={editing} catalog={catalog} onDone={() => setEditing(null)} /> : (
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap gap-3">
              <input className={cn(field, "w-72")} placeholder="Filter games…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter games" />
              <button onClick={() => setEditing(blankGame())} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] text-bg"><Plus size={14} /> New game</button>
            </div>
            <ul className="divide-y divide-line">
              {games.map((g) => (
                <li key={g.slug} className="flex flex-wrap items-center gap-3 py-3 text-[13.5px]">
                  <span className="flex-1 font-medium">{g.title}</span>
                  <span className="text-muted">{g.credits.director ?? "—"}</span>
                  <span className="tabular w-24 text-muted">{g.releaseDate}</span>
                  <span className="hidden gap-1 md:flex">{g.benchmarked.slice(0, 4).map((p) => <PlatformBadge key={p} id={p} size="xs" />)}</span>
                  <button onClick={() => setEditing(g)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label={`Edit ${g.title}`}><Pencil size={14} /></button>
                  <button onClick={() => confirm(`Delete ${g.title}?`) && call("DELETE", `/api/admin/games?slug=${g.slug}`)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-red-700" aria-label={`Delete ${g.title}`}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
      {tab === "specs" && <SpecsEditor catalog={catalog} />}
      {tab === "perf" && <PerfAdmin catalog={catalog} />}
      {tab === "queue" && <Moderation catalog={catalog} />}
      <p className="mt-6 text-[12px] text-muted">Changes are written to <code className="tabular">.data/store.json</code> and pages revalidate immediately. Seed data stays untouched, so deleting that file resets everything.</p>
    </div>
  );
}
