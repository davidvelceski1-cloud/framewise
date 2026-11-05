import Link from "next/link";
import { ArrowRight, Cpu, Sparkles } from "lucide-react";
import { getCatalog } from "@/lib/db";
import { bestTestPerPlatform } from "@/lib/analysis";
import { families, familyOrder, modeLabels, platformById, platforms } from "@/lib/platforms";
import { GameCard } from "@/components/game-card";
import { HeroSearch } from "@/components/hero-search";
import { Button, Counter, GameCover, PlatformBadge, Reveal, SectionHeader } from "@/components/ui";
import { fmtFps } from "@/lib/utils";

const TRENDING = ["cyberpunk-2077", "elden-ring", "hogwarts-legacy", "black-myth-wukong"];

export default async function Home() {
  const cat = await getCatalog();
  const latest = (g: (typeof cat.games)[number]) => g.releases.reduce((m, r) => (r.date > m ? r.date : m), g.releaseDate);
  const newest = [...cat.games].sort((a, b) => latest(b).localeCompare(latest(a))).slice(0, 4);
  const trending = TRENDING.map((s) => cat.games.find((g) => g.slug === s)).filter(Boolean) as typeof cat.games;
  const featured = cat.studios.find((s) => s.slug === "fromsoftware")!;
  const featuredGames = cat.games.filter((g) => g.developers.includes(featured.slug) || g.publishers.includes(featured.slug));

  return (
    <>
      {/* Hero */}
      <section className="hero-gradient relative -mt-[68px] overflow-hidden pb-24 pt-[160px]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <Reveal>
            <p className="hairline mx-auto inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-1.5 text-[12.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> The Game Performance Atlas
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-7 max-w-4xl font-display text-[44px] font-semibold leading-[1.02] md:text-[84px]">
              Every game. Every platform. <span className="bg-gradient-to-r from-[#B8925A] to-[#C9A96E] bg-clip-text text-transparent">Every frame.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-[17px] text-muted">
              Credits, PC requirements and side-by-side performance across PlayStation, Xbox, Nintendo, Steam Deck and PC, in one calm, precise reference.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10">
            <HeroSearch />
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { v: cat.games.length, l: "Games catalogued" },
                { v: platforms.length, l: "Platforms & presets" },
                { v: cat.tests.length, l: "Performance entries" },
              ].map((s) => (
                <div key={s.l}>
                  <Counter value={s.v} className="font-display text-3xl font-semibold md:text-4xl" />
                  <p className="mt-1 text-[12.5px] text-muted">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Platform strip */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {familyOrder.map((f, i) => {
            const fam = families[f];
            const first = platforms.find((p) => p.family === f)!;
            return (
              <Reveal key={f} delay={i * 0.04}>
                <Link href={`/platforms/${first.slug}`} className="card lift group relative block overflow-hidden p-5">
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${fam.gradient[0]}, ${fam.gradient[1]})` }} />
                  <p className="font-display text-[17px] font-semibold">{fam.name}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{platforms.filter((p) => p.family === f).map((p) => p.short).join(" · ")}</p>
                  <ArrowRight size={15} className="mt-4 text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Trending comparisons */}
      <section className="mx-auto mt-28 max-w-7xl px-6">
        <SectionHeader eyebrow="Trending comparisons" title="Where it runs best, at a glance." desc="Best mode on each platform, ranked by our overall score of frame rate, resolution, stability, features and loading." action={<Button variant="outline" href="/compare">Open the Comparator <ArrowRight size={15} /></Button>} />
        <div className="grid gap-5 md:grid-cols-2">
          {trending.map((g, i) => {
            const best = bestTestPerPlatform(cat.tests.filter((t) => t.gameSlug === g.slug)).slice(0, 5);
            const max = Math.max(...best.map((t) => t.fpsAvg), 60);
            return (
              <Reveal key={g.slug} delay={i * 0.05}>
                <Link href={`/compare?game=${g.slug}`} className="card lift flex gap-5 p-4">
                  <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="hidden aspect-[3/4] w-28 shrink-0 sm:block" />
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">{g.title}</h3>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted">fps avg</span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {best.map((t, j) => (
                        <li key={t.id} className="grid grid-cols-[72px_1fr_44px] items-center gap-3 text-[12.5px]">
                          <span className="truncate text-muted">{platformById[t.platform].short}</span>
                          <span className="h-2 overflow-hidden rounded-full bg-surface" title={`${modeLabels[t.mode]} mode`}>
                            <span className="block h-full rounded-full" style={{ width: `${(t.fpsAvg / max) * 100}%`, background: platformById[t.platform].chart }} />
                          </span>
                          <span className="tabular text-right">
                            {fmtFps(Math.round(t.fpsAvg))}
                            {j === 0 && <span className="ml-0.5 text-gold">★</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* AI + Can I run */}
      <section className="mx-auto mt-28 grid max-w-7xl gap-5 px-6 md:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <div className="card relative h-full overflow-hidden p-8 md:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(var(--gold-soft), transparent 70%)" }} />
            <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink"><Sparkles size={14} /> AI Game Assistant</p>
            <h3 className="mt-4 max-w-md font-display text-3xl font-semibold">Ask in plain language. Get answers with sources.</h3>
            <p className="mt-3 max-w-md text-muted">Answers come only from the FRAMEWISE database, with every figure cited. When we don&apos;t have the data, it says so.</p>
            <div className="mt-6 space-y-2">
              {["Can my RTX 3060 run Cyberpunk 2077 at 1440p?", "Where does Elden Ring run best?"].map((q) => (
                <p key={q} className="hairline w-fit rounded-2xl bg-surface px-4 py-2.5 text-[13.5px]">“{q}”</p>
              ))}
            </div>
            <Button variant="primary" className="mt-7" href="/assistant">Open the Assistant <ArrowRight size={15} /></Button>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="card h-full p-8 md:p-10">
            <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink"><Cpu size={14} /> Can I run it?</p>
            <h3 className="mt-4 font-display text-3xl font-semibold">Your PC, every game.</h3>
            <p className="mt-3 text-muted">Save your CPU, GPU and RAM once to get an expected preset, frame rate and confidence level for every game in the catalog.</p>
            <Button variant="gold" className="mt-7" href="/can-i-run">Check my build</Button>
          </div>
        </Reveal>
      </section>

      {/* New releases */}
      <section className="mx-auto mt-28 max-w-7xl px-6">
        <SectionHeader eyebrow="New & updated" title="Latest arrivals." action={<Button variant="outline" href="/games">All games <ArrowRight size={15} /></Button>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((g, i) => (
            <Reveal key={g.slug} delay={i * 0.05}>
              <GameCard game={g} tests={cat.tests.filter((t) => t.gameSlug === g.slug)} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured studio */}
      <section className="mx-auto mt-28 max-w-7xl px-6">
        <Reveal>
          <div className="card grid overflow-hidden md:grid-cols-[1fr_1.2fr]">
            <div className="relative min-h-[260px] p-10 text-white" style={{ background: `linear-gradient(140deg, ${featured.colors[0]}, #0E1116)` }}>
              <p className="text-[12px] uppercase tracking-[0.18em] text-white/60">Featured studio</p>
              <p className="mt-6 font-display text-[64px] font-semibold leading-none" style={{ color: featured.colors[1] }}>{featured.monogram}</p>
              <p className="mt-4 font-display text-2xl font-semibold">{featured.name}</p>
              <p className="text-sm text-white/70">{featured.hq} · Founded {featured.founded}</p>
            </div>
            <div className="p-10">
              <p className="text-muted">{featured.history}</p>
              <div className="mt-6 space-y-3">
                {featuredGames.map((g) => (
                  <Link key={g.slug} href={`/games/${g.slug}`} className="hairline flex items-center gap-4 rounded-2xl p-3 transition hover:bg-surface">
                    <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-14 w-11 shrink-0 rounded-xl [&_p]:hidden" />
                    <div className="flex-1">
                      <p className="font-medium">{g.title}</p>
                      <p className="text-[12.5px] text-muted">{g.releaseDate.slice(0, 4)} · {g.engine}</p>
                    </div>
                    <div className="hidden gap-1.5 sm:flex">
                      {bestTestPerPlatform(cat.tests.filter((t) => t.gameSlug === g.slug)).slice(0, 3).map((t) => <PlatformBadge key={t.platform} id={t.platform} size="xs" />)}
                    </div>
                  </Link>
                ))}
              </div>
              <Button variant="outline" className="mt-6" href={`/studios/${featured.slug}`}>Studio profile <ArrowRight size={15} /></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
