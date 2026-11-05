import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Cpu } from "lucide-react";
import { getCatalog, getGame } from "@/lib/db";
import { bestTestPerPlatform } from "@/lib/analysis";
import { modeLabels, platformById, releasePlatformMeta } from "@/lib/platforms";
import { allSeedGames as seedGames } from "@/lib/data/all";
import { ESTIMATED_SOURCE } from "@/lib/data/expand";
import type { ReqTier } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { FpsSnapshot } from "@/components/charts";
import { GameActions } from "@/components/game-actions";
import { GameCard } from "@/components/game-card";
import { PerfTable } from "@/components/perf-table";
import { Tabs } from "@/components/tabs";
import { Button, EmptyState, GameCover, Pill, ReleaseBadge, Reveal, Stat } from "@/components/ui";

export function generateStaticParams() {
  return seedGames.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await getGame(slug);
  return d ? { title: d.game.title, description: d.game.summary } : { title: "Game not found" };
}

function ReqCard({ label, tier, accent }: { label: string; tier: ReqTier; accent?: boolean }) {
  const rows: [string, string][] = [
    ["CPU", tier.cpu],
    ["GPU", tier.gpu],
    ["RAM", `${tier.ram} GB`],
    ["VRAM", `${tier.vram} GB`],
    ["Storage", tier.storage],
    ["OS", tier.os],
    ["API", tier.api],
  ];
  return (
    <div className={`card relative overflow-hidden p-6 ${accent ? "ring-1 ring-gold/50" : ""}`}>
      {accent && <div className="gold-gradient absolute inset-x-0 top-0 h-1" />}
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold">{label}</p>
        {accent && <Pill tone="gold">Premium tier</Pill>}
      </div>
      <p className="tabular mt-1 text-[12.5px] text-gold-ink">{tier.target}</p>
      <dl className="mt-5 space-y-3 text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[72px_1fr] gap-3 border-t border-line pt-3">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular text-[13px]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function GamePage({ params }: PageProps<"/games/[slug]">) {
  // params are runtime data under Cache Components: stream them inside Suspense.
  // Slugs from generateStaticParams still prerender completely at build time.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GamePageBody params={params} />
    </Suspense>
  );
}

async function GamePageBody({ params }: { params: PageProps<"/games/[slug]">["params"] }) {
  const { slug } = await params;
  const d = await getGame(slug);
  if (!d) notFound();
  const { game, tests, requirements: req, developers, publishers } = d;
  const cat = await getCatalog();
  const best = bestTestPerPlatform(tests);
  const similar = cat.games
    .filter((g) => g.slug !== game.slug)
    .map((g) => ({ g, s: g.genres.filter((x) => game.genres.includes(x)).length * 2 + g.tags.filter((x) => game.tags.includes(x)).length }))
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.g);
  const enhanced = game.releases.filter((r) => r.edition);

  const credits: [string, React.ReactNode][] = [
    ["Developer", developers.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link className="underline decoration-line-strong underline-offset-4 hover:text-gold-ink" href={`/studios/${s.slug}`}>{s.name}</Link></span>)],
    ["Publisher", publishers.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link className="underline decoration-line-strong underline-offset-4 hover:text-gold-ink" href={`/studios/${s.slug}`}>{s.name}</Link></span>)],
    ["Director", game.credits.director ?? "—"],
    ["Lead writer", game.credits.leadWriter ?? "—"],
    ["Composer", game.credits.composer ?? "—"],
    ...(game.credits.producer ? [["Producer", game.credits.producer] as [string, string]] : []),
    ["Engine", game.engine],
  ];

  const overview = (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-6">
        <div className="card p-7">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">About</p>
          <p className="mt-3 text-[16px] leading-relaxed">{game.summary}</p>
        </div>
        <div className="card p-7">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">Credits</p>
          <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {credits.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] uppercase tracking-[0.14em] text-muted">{k}</dt>
                <dd className="mt-1 text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          {Object.values(game.credits).filter(Boolean).length < 3 && <p className="mt-5 text-xs text-muted">Fields marked “—” aren&apos;t in our database yet.</p>}
        </div>
        <div className="card p-7">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">Platforms & editions</p>
          <ul className="mt-4 divide-y divide-line">
            {[...game.releases].sort((a, b) => a.date.localeCompare(b.date)).map((r) => (
              <li key={r.platform} className="flex flex-wrap items-center gap-3 py-3">
                <ReleaseBadge platform={r.platform} />
                <span className="text-[14px]">{releasePlatformMeta[r.platform].label}</span>
                {r.edition && <Pill tone="gold">{r.edition}</Pill>}
                <span className="tabular ml-auto text-[13px] text-muted">{formatDate(r.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-6">
        <div className="card p-7">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">Performance snapshot</p>
            <span className="text-[11px] text-muted">best mode · avg fps</span>
          </div>
          <div className="mt-5">{best.length ? <FpsSnapshot tests={best} /> : <p className="text-sm text-muted">No performance data yet.</p>}</div>
          {best.some((t) => t.demo) && <p className="mt-4 text-[11.5px] text-muted">Demo data: illustrative figures, not measured benchmarks.</p>}
          <Button variant="primary" className="mt-6 w-full" href={`/compare?game=${game.slug}`}>Full comparison <ArrowRight size={15} /></Button>
        </div>
        <div className="card p-7">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">At a glance</p>
          <div className="mt-4 grid grid-cols-2 gap-5">
            <Stat label="Released">{formatDate(game.releaseDate)}</Stat>
            <Stat label="Engine">{game.engine}</Stat>
            <Stat label="Steam Deck">{game.profile.deck ? game.profile.deck[0].toUpperCase() + game.profile.deck.slice(1) : "—"}</Stat>
            <Stat label="Latest patch tested"><span className="tabular">{game.profile.patch}</span></Stat>
          </div>
        </div>
      </div>
    </div>
  );

  const specs = req ? (
    <div>
      {req.source === ESTIMATED_SOURCE && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-5 py-3.5 text-[13.5px]">
          <Pill tone="warn">Estimated</Pill>
          <span className="text-muted">The official PC requirements for this game aren&apos;t in our database yet. These tiers are estimated from its release year and engine.</span>
        </div>
      )}
      <div className={`grid gap-5 ${req.ultra ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
        <ReqCard label="Minimum" tier={req.minimum} />
        <ReqCard label="Recommended" tier={req.recommended} />
        {req.ultra && <ReqCard label="Ultra / 4K" tier={req.ultra} accent />}
      </div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[20px] border border-dashed border-line-strong p-6 md:flex-row md:items-center">
        <div>
          <p className="font-medium">Will your PC handle it?</p>
          <p className="text-sm text-muted">Get an estimated preset and frame rate for your build, with a confidence level.</p>
        </div>
        <Button variant="gold" href={`/can-i-run?game=${game.slug}`}><Cpu size={15} /> Can I run it?</Button>
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        {req.source === ESTIMATED_SOURCE && <Pill tone="warn">Estimated requirements</Pill>}
        Source: {req.source}
      </p>
    </div>
  ) : (
    <EmptyState title="Not on PC" desc={`${game.title} isn't released on PC, so there are no PC requirements.`} />
  );

  const performance = tests.length ? (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{tests.length} entries across {best.length} platforms. Every figure shows its source and verification status.</p>
        <Button variant="outline" size="sm" href={`/compare?game=${game.slug}`}>Compare visually <ArrowRight size={14} /></Button>
      </div>
      <PerfTable tests={tests} />
    </div>
  ) : (
    <EmptyState title="No benchmarks yet" desc="Be the first to submit a measurement for this game." action={<Button href="/dashboard#submit" variant="outline">Submit a benchmark</Button>} />
  );

  const patches = (
    <ol className="relative ml-3 space-y-8 border-l border-line pl-8">
      {[...game.patches].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
        <li key={p.version} className="relative">
          <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full border-2 border-bg bg-gold" />
          <p className="tabular text-[12.5px] text-muted">{formatDate(p.date)}</p>
          <p className="mt-1 font-display text-lg font-semibold">Version {p.version}</p>
          <p className="mt-1 max-w-xl text-[14.5px] text-muted">{p.notes}</p>
          {p.version === game.profile.patch && <Pill className="mt-2" tone="neutral">Used for current performance entries</Pill>}
        </li>
      ))}
    </ol>
  );

  const similarEl = similar.length ? (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {similar.map((g) => <GameCard key={g.slug} game={g} tests={cat.tests.filter((t) => t.gameSlug === g.slug)} />)}
    </div>
  ) : (
    <EmptyState title="Nothing similar yet" desc="As the catalog grows, related games will appear here." />
  );

  return (
    <article>
      <header className="relative -mt-[68px] overflow-hidden pt-[120px]">
        <div className="absolute inset-0 opacity-[0.22] blur-3xl" style={{ background: `radial-gradient(60% 80% at 20% 20%, ${game.cover[1]}, transparent 60%), radial-gradient(60% 80% at 90% 10%, ${game.cover[2]}, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-14 md:grid-cols-[300px_1fr] md:items-end">
          <Reveal>
            <GameCover title={game.title} cover={game.cover} image={game.coverUrl} size="lg" className="aspect-[3/4] w-full max-w-[300px] shadow-lift" />
          </Reveal>
          <Reveal delay={0.06}>
            <div>
              <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/games" className="hover:text-ink">Games</Link> <span className="mx-1">/</span> {game.title}</nav>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">{game.title}</h1>
              <p className="mt-3 max-w-2xl text-[17px] text-muted">{game.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px]">
                <span><span className="text-muted">Released</span> <span className="tabular">{formatDate(game.releaseDate)}</span></span>
                <span><span className="text-muted">Genres</span> {game.genres.join(" · ")}</span>
                {game.criticScore && <span className="flex items-center gap-2"><span className="text-muted">Critic score</span> <span className="tabular gold-gradient rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold">{game.criticScore}</span><span className="text-[11px] text-muted">(approx.)</span></span>}
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {[...new Set(game.releases.map((r) => r.platform))].map((p) => <ReleaseBadge key={p} platform={p} />)}
              </div>
              {enhanced.length > 0 && <p className="mt-3 text-[12.5px] text-muted">Enhanced: {enhanced.map((r) => r.edition).join(" · ")}</p>}
              <div className="mt-7 flex flex-wrap gap-2">
                <Button variant="primary" href={`/compare?game=${game.slug}`}>Compare platforms <ArrowRight size={15} /></Button>
                <GameActions slug={game.slug} title={game.title} />
              </div>
              {best[0] && (
                <p className="mt-6 text-[13px] text-muted">
                  Runs best on <span className="text-ink">{platformById[best[0].platform].name}</span> in {modeLabels[best[0].mode]} mode.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6">
        <Tabs
          tabs={[
            { id: "overview", label: "Overview", content: overview },
            { id: "specs", label: "Specs", content: specs },
            { id: "performance", label: "Performance", content: performance },
            { id: "patches", label: "Patches & updates", content: patches },
            { id: "similar", label: "Similar games", content: similarEl },
          ]}
        />
      </div>
    </article>
  );
}
