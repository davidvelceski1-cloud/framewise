import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/db";
import { allStudios as studios } from "@/lib/data/all";
import { bestTestPerPlatform } from "@/lib/analysis";
import { platformById } from "@/lib/platforms";
import { GameCard } from "@/components/game-card";
import { Counter, Stat } from "@/components/ui";

export function generateStaticParams() {
  return studios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/studios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: studios.find((s) => s.slug === slug)?.name ?? "Studio" };
}

export default function StudioPage({ params }: PageProps<"/studios/[slug]">) {
  // params are runtime data under Cache Components: stream them inside Suspense.
  // Slugs from generateStaticParams still prerender completely at build time.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudioPageBody params={params} />
    </Suspense>
  );
}

async function StudioPageBody({ params }: { params: PageProps<"/studios/[slug]">["params"] }) {
  const { slug } = await params;
  const cat = await getCatalog();
  const s = cat.studios.find((x) => x.slug === slug);
  if (!s) notFound();
  const games = cat.games.filter((g) => g.developers.includes(s.slug) || g.publishers.includes(s.slug));
  const tests = cat.tests.filter((t) => games.some((g) => g.slug === t.gameSlug));
  const best = games.flatMap((g) => bestTestPerPlatform(tests.filter((t) => t.gameSlug === g.slug)));
  const consoleBest = best.filter((t) => ["playstation", "xbox", "nintendo"].includes(platformById[t.platform].family));
  const avg = (arr: typeof best) => (arr.length ? arr.reduce((a, t) => a + t.fpsAvg, 0) / arr.length : 0);
  const sixty = consoleBest.length ? (consoleBest.filter((t) => t.fpsAvg >= 58.5).length / consoleBest.length) * 100 : 0;
  const related = cat.studios.filter((x) => x.slug !== s.slug && games.some((g) => g.developers.includes(x.slug) || g.publishers.includes(x.slug)));

  return (
    <div>
      <section className="relative -mt-[68px] overflow-hidden pb-14 pt-[130px]">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(60% 90% at 10% 0%, ${s.colors[0]}55, transparent 60%), radial-gradient(50% 70% at 90% 10%, ${s.colors[1]}44, transparent 60%)` }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[auto_1fr] md:items-center">
          <span className="grid h-32 w-32 place-items-center rounded-[28px] font-display text-4xl font-semibold shadow-lift" style={{ background: `linear-gradient(140deg, ${s.colors[0]}, #0E1116)`, color: s.colors[1] }} aria-label={`${s.name} monogram`}>{s.monogram}</span>
          <div>
            <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/studios" className="hover:text-ink">Studios</Link> / {s.name}</nav>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-6xl">{s.name}</h1>
            <p className="mt-3 max-w-2xl text-muted">{s.history}</p>
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              <Stat label="Role">{s.kind === "both" ? "Developer & publisher" : s.kind === "studio" ? "Developer" : "Publisher"}</Stat>
              {s.founded && <Stat label="Founded"><span className="tabular">{s.founded}</span></Stat>}
              {s.hq && <Stat label="Headquarters">{s.hq}</Stat>}
              {s.parent && <Stat label="Parent">{s.parent}</Stat>}
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6">
        <div className="card grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
          <div><Counter value={games.length} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">games in catalog</p></div>
          <div><Counter value={avg(consoleBest)} decimals={1} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">avg console fps (best mode)</p></div>
          <div><Counter value={sixty} suffix="%" className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">console versions at 60 fps</p></div>
          <div><Counter value={avg(best.filter((t) => t.platform === "pc-high"))} decimals={0} className="font-display text-3xl font-semibold" /><p className="text-[12.5px] text-muted">avg fps on PC High</p></div>
        </div>
        {tests.some((t) => t.demo) && <p className="mt-3 text-[12px] text-muted">Averages include demo data.</p>}
        <h2 className="mb-5 mt-14 font-display text-2xl font-semibold">Catalog</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((g) => <GameCard key={g.slug} game={g} tests={tests.filter((t) => t.gameSlug === g.slug)} />)}
        </div>
        {related.length > 0 && (
          <>
            <h2 className="mb-4 mt-14 font-display text-xl font-semibold">Works with</h2>
            <div className="flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/studios/${r.slug}`} className="hairline rounded-full bg-card px-3.5 py-1.5 text-[13px] hover:shadow-soft">{r.name}</Link>)}</div>
          </>
        )}
      </div>
    </div>
  );
}
