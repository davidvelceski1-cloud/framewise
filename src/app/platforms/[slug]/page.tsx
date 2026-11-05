import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/db";
import { overallScore } from "@/lib/analysis";
import { families, modeLabels, platforms } from "@/lib/platforms";
import { Counter, EmptyState, GameCover, Pill, Reveal, Stat } from "@/components/ui";
import { formatDate, fmtFps } from "@/lib/utils";

export function generateStaticParams() {
  return platforms.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/platforms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = platforms.find((x) => x.slug === slug);
  return { title: p ? p.name : "Platform" };
}

export default function PlatformPage({ params }: PageProps<"/platforms/[slug]">) {
  // params are runtime data under Cache Components: stream them inside Suspense.
  // Slugs from generateStaticParams still prerender completely at build time.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PlatformPageBody params={params} />
    </Suspense>
  );
}

async function PlatformPageBody({ params }: { params: PageProps<"/platforms/[slug]">["params"] }) {
  const { slug } = await params;
  const p = platforms.find((x) => x.slug === slug);
  if (!p) notFound();
  const fam = families[p.family];
  const cat = await getCatalog();
  const tests = cat.tests.filter((t) => t.platform === p.id);
  const bestPerGame = new Map<string, (typeof tests)[number]>();
  for (const t of tests) {
    const cur = bestPerGame.get(t.gameSlug);
    if (!cur || overallScore(t) > overallScore(cur)) bestPerGame.set(t.gameSlug, t);
  }
  const ranked = [...bestPerGame.values()].sort((a, b) => overallScore(b) - overallScore(a));
  const avgFps = tests.length ? tests.reduce((s, t) => s + t.fpsAvg, 0) / tests.length : 0;
  const sixty = ranked.filter((t) => t.fpsAvg >= 58.5).length;
  const avgRes = tests.length ? tests.reduce((s, t) => s + t.nativePixels, 0) / tests.length : 0;
  const siblings = platforms.filter((x) => x.family === p.family && x.id !== p.id);

  return (
    <div>
      <section className="relative -mt-[68px] overflow-hidden pb-16 pt-[130px]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${fam.tint}, transparent 85%), radial-gradient(70% 90% at 85% 0%, ${fam.gradient[1]}33, transparent 60%)` }} />
        <div className="relative mx-auto max-w-7xl px-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/platforms" className="hover:text-ink">Platforms</Link> / {fam.name}</nav>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: fam.primary }} />
            <span className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: p.family === "pc" ? "var(--muted)" : fam.primary === "#1A9FFF" ? "var(--ink)" : fam.primary }}>{fam.name}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">{p.name}</h1>
          <p className="mt-3 max-w-xl text-muted">{p.blurb}</p>
          {siblings.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {siblings.map((s) => <Link key={s.id} href={`/platforms/${s.slug}`} className="hairline rounded-full bg-card/70 px-3 py-1 text-[12.5px] hover:bg-card">{s.short} →</Link>)}
            </div>
          )}
          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            <div><Counter value={ranked.length} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">games benchmarked</p></div>
            <div><Counter value={avgFps} decimals={1} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">average fps (all modes)</p></div>
            <div><Counter value={sixty} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">games at 60 fps+</p></div>
            <div><Counter value={avgRes} suffix="p" className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">avg internal res</p></div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="mb-5 font-display text-2xl font-semibold">Top-performing games</h2>
          {ranked.length === 0 ? (
            <EmptyState title="No benchmarks yet" desc="No games have been measured on this platform." />
          ) : (
            <ol className="space-y-3">
              {ranked.slice(0, 40).map((t, i) => {
                const g = cat.games.find((x) => x.slug === t.gameSlug)!;
                return (
                  <Reveal key={t.id} delay={Math.min(i, 8) * 0.03}>
                    <li>
                      <Link href={`/compare?game=${g.slug}`} className="card lift flex items-center gap-4 p-3 pr-5">
                        <span className="tabular w-6 text-center text-[13px] text-muted">{i + 1}</span>
                        <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-16 w-12 shrink-0 rounded-xl [&_p]:hidden" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{g.title}</p>
                          <p className="text-[12.5px] text-muted">{modeLabels[t.mode]} · {t.nativeRes} → {t.outputRes} · {t.upscaler}</p>
                        </div>
                        <div className="text-right">
                          <p className="tabular font-display text-xl font-semibold">{fmtFps(t.fpsAvg)}</p>
                          <p className="text-[11px] text-muted">fps avg</p>
                        </div>
                        {i === 0 && <Pill tone="gold" className="hidden sm:inline-flex">Top</Pill>}
                      </Link>
                    </li>
                  </Reveal>
                );
              })}
            </ol>
          )}
          {ranked.length > 40 && (
            <p className="mt-4 text-[13px] text-muted">
              Showing the top 40 of {ranked.length} games. <Link href={`/games?q=${encodeURIComponent("games on " + p.short)}`} className="text-gold-ink hover:underline">Browse all {p.short} games →</Link>
            </p>
          )}
          {tests.some((t) => t.demo) && <p className="mt-4 text-[12px] text-muted">Includes demo data: illustrative figures, not measured benchmarks.</p>}
        </section>
        <aside className="space-y-6">
          <div className="card overflow-hidden">
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${fam.gradient[0]}, ${fam.gradient[1]})` }} />
            <div className="space-y-4 p-6">
              <p className="font-display text-lg font-semibold">Hardware</p>
              <Stat label="CPU">{p.hardware.cpu}</Stat>
              <Stat label="GPU">{p.hardware.gpu}</Stat>
              <Stat label="Memory">{p.hardware.memory}</Stat>
              <Stat label="Storage">{p.hardware.storage}</Stat>
              <Stat label="Output">{p.hardware.output}</Stat>
              {p.hardware.launched && <Stat label="Launched">{formatDate(p.hardware.launched)}</Stat>}
            </div>
          </div>
          <div className="card p-6 text-[13px] text-muted">
            <p className="font-medium text-ink">Theme tokens</p>
            <p className="mt-2">Primary <span className="tabular">{fam.primary}</span> · Secondary <span className="tabular">{fam.secondary}</span></p>
            <p>Gradient <span className="tabular">{fam.gradient.join(" → ")}</span></p>
            <p className="mt-1">{fam.treatment}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
