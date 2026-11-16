import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCatalog } from "@/lib/db";
import { bestTestPerPlatform } from "@/lib/analysis";
import { families, familyOrder, modeLabels, platformById, platforms } from "@/lib/platforms";
import { platformImage, studioMedia, leaderRoleLabel } from "@/lib/data/media";
import type { Game } from "@/lib/types";
import { HomeHero, type HeroSlide } from "@/components/home-hero";
import { ShowcaseTabs, type ShowcaseGame } from "@/components/showcase-tabs";
import { PersonPhoto, StudioMark } from "@/components/media";
import { Button, Counter, GameCover, PlatformBadge, Reveal } from "@/components/ui";
import { fmtFps } from "@/lib/utils";

const HERO = ["elden-ring", "cyberpunk-2077", "black-myth-wukong", "baldurs-gate-3", "god-of-war-ragnarok"];
const TRENDING = ["cyberpunk-2077", "elden-ring", "hogwarts-legacy", "black-myth-wukong", "monster-hunter-wilds"];
const COMPARE = ["cyberpunk-2077", "elden-ring", "hogwarts-legacy", "black-myth-wukong"];

function SectionTitle({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-display text-[28px] font-bold leading-tight md:text-[40px]">{title}</h2>
      {desc && <p className="mx-auto mt-3 max-w-2xl text-[15px] text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default async function Home() {
  const cat = await getCatalog();
  const bySlug = (s: string) => cat.games.find((g) => g.slug === s);
  const testsOf = (g: Game) => cat.tests.filter((t) => t.gameSlug === g.slug);
  const bestLine = (g: Game) => {
    const b = bestTestPerPlatform(testsOf(g))[0];
    return b ? `Best on ${platformById[b.platform].short} · ${fmtFps(Math.round(b.fpsAvg))} fps` : undefined;
  };
  const toShowcase = (g: Game): ShowcaseGame => ({
    slug: g.slug, title: g.title, cover: g.cover, coverUrl: g.coverUrl, heroUrl: g.heroUrl, logoUrl: g.logoUrl,
    genres: g.genres, releaseDate: g.releaseDate, criticScore: g.criticScore, best: bestLine(g),
  });

  const slides: HeroSlide[] = HERO.map(bySlug)
    .filter((g): g is Game => Boolean(g?.heroUrl))
    .map((g) => ({ slug: g.slug, title: g.title, tagline: g.tagline, heroUrl: g.heroUrl!, logoUrl: g.logoUrl, eyebrow: bestLine(g) }));

  const latest = (g: Game) => g.releases.reduce((m, r) => (r.date > m ? r.date : m), g.releaseDate);
  const withArt = cat.games.filter((g) => g.heroUrl);
  const tabs = [
    { id: "trending", label: "Trending", games: TRENDING.map(bySlug).filter(Boolean).map((g) => toShowcase(g!)) },
    { id: "new", label: "New releases", games: [...withArt].sort((a, b) => latest(b).localeCompare(latest(a))).slice(0, 5).map(toShowcase) },
    { id: "top", label: "Top rated", games: [...withArt].sort((a, b) => (b.criticScore ?? 0) - (a.criticScore ?? 0)).slice(0, 5).map(toShowcase) },
  ];

  const compare = COMPARE.map(bySlug).filter(Boolean) as Game[];
  const featured = cat.studios.find((s) => s.slug === "fromsoftware")!;
  const featuredMedia = studioMedia(featured.slug);
  const featuredGames = cat.games.filter((g) => g.developers.includes(featured.slug) || g.publishers.includes(featured.slug));
  const assistantArt = bySlug("elden-ring")?.heroUrl;
  const pcPhoto = platformImage("pc-high");

  return (
    <>
      {slides.length > 0 && <HomeHero slides={slides} />}

      {/* Product-style showcase */}
      <section className="mx-auto max-w-[1440px] px-6 pt-20 lg:px-10">
        <SectionTitle title="Discover the catalog" />
        <ShowcaseTabs tabs={tabs} />
      </section>

      {/* Platforms with hardware photos */}
      <section className="mx-auto mt-24 max-w-[1440px] px-6 lg:px-10">
        <SectionTitle title="Explore by platform" desc="Specs and the best-running games for every console, handheld and PC preset." />
        <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-5">
          {familyOrder.flatMap((f) => platforms.filter((p) => p.family === f)).map((p) => {
            const img = platformImage(p.slug);
            const n = new Set(cat.tests.filter((t) => t.platform === p.id).map((t) => t.gameSlug)).size;
            return (
              <Link key={p.id} href={`/platforms/${p.slug}`} className="card lift group flex w-[240px] shrink-0 snap-start flex-col overflow-hidden lg:w-auto">
                <div className="relative aspect-[4/3] overflow-hidden bg-white">
                  {img && <Image src={img.url} alt={`${p.name} hardware`} fill sizes="(max-width: 1024px) 240px, 280px" className="object-contain" />}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{families[p.family].name}</p>
                  <p className="mt-1 font-display text-[18px] font-bold">{p.short}</p>
                  <p className="mt-1 text-[13px] text-muted">{n} games benchmarked</p>
                  <span className="mt-auto flex items-center gap-0.5 pt-4 text-[13.5px] font-semibold underline-offset-4 group-hover:underline">
                    Learn more <ChevronRight size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Two promo tiles on imagery */}
      <section className="mx-auto mt-24 grid max-w-[1440px] gap-4 px-6 md:grid-cols-2 lg:px-10">
        <Reveal>
          <div className="relative flex min-h-[440px] flex-col justify-end overflow-hidden rounded-[20px] bg-black p-8 text-white md:p-10">
            {assistantArt && <Image src={assistantArt} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80">AI Game Assistant</p>
              <h3 className="mt-2 max-w-md font-display text-[30px] font-bold leading-tight">Ask in plain language. Get answers with sources.</h3>
              <p className="mt-3 max-w-md text-[15px] text-white/80">Every figure comes from the FRAMEWISE database, with citations. When the data isn&apos;t there, it says so.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="light" href="/assistant">Ask now</Button>
                <Button variant="ghostLight" href="/assistant">Learn more</Button>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="relative flex min-h-[440px] flex-col justify-end overflow-hidden rounded-[20px] bg-[#111] p-8 text-white md:p-10">
            {pcPhoto && <Image src={pcPhoto.url} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-75" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80">Can I run it?</p>
              <h3 className="mt-2 max-w-md font-display text-[30px] font-bold leading-tight">Your PC, every game.</h3>
              <p className="mt-3 max-w-md text-[15px] text-white/80">Save your CPU, GPU and RAM once to see the expected preset, frame rate and confidence for every game.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="light" href="/can-i-run">Check my build</Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Where it runs best */}
      <section className="mx-auto mt-24 max-w-[1440px] px-6 lg:px-10">
        <SectionTitle title="Where it runs best" desc="The best mode on each platform, ranked by frame rate, resolution, stability, features and loading." action={<Button variant="outline" href="/compare">Open the Comparator</Button>} />
        <div className="grid gap-4 md:grid-cols-2">
          {compare.map((g, i) => {
            const best = bestTestPerPlatform(testsOf(g)).slice(0, 5);
            const max = Math.max(...best.map((t) => t.fpsAvg), 60);
            return (
              <Reveal key={g.slug} delay={i * 0.05}>
                <Link href={`/compare?game=${g.slug}`} className="card lift flex gap-6 p-6">
                  <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="hidden aspect-[3/4] w-28 shrink-0 rounded-xl sm:block" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{g.title}</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">fps avg</span>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {best.map((t, j) => (
                        <li key={t.id} className="grid grid-cols-[72px_1fr_44px] items-center gap-3 text-[12.5px]">
                          <span className="truncate font-medium">{platformById[t.platform].short}</span>
                          <span className="h-2 overflow-hidden rounded-full bg-surface" title={`${modeLabels[t.mode]} mode`}>
                            <span className="block h-full rounded-full" style={{ width: `${(t.fpsAvg / max) * 100}%`, background: platformById[t.platform].chart }} />
                          </span>
                          <span className="tabular text-right">
                            {fmtFps(Math.round(t.fpsAvg))}
                            {j === 0 && <span className="ml-0.5 text-gold" aria-label="best">★</span>}
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

      {/* Featured studio */}
      <section className="mx-auto mt-24 max-w-[1440px] px-6 lg:px-10">
        <Reveal>
          <div className="card grid gap-10 p-8 md:grid-cols-[1fr_1.3fr] md:p-12">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Featured studio</p>
              <div className="mt-6 flex items-center gap-5">
                <StudioMark studio={featured} media={featuredMedia} size="lg" />
                <div>
                  <p className="font-display text-[28px] font-bold leading-tight">{featured.name}</p>
                  <p className="text-[14px] text-muted">{featured.hq} · Founded {featured.founded}</p>
                </div>
              </div>
              <p className="mt-6 text-[15px] text-muted">{featured.history}</p>
              {featuredMedia?.leader && (
                <div className="mt-6 flex items-center gap-3">
                  <PersonPhoto name={featuredMedia.leader.name} photo={featuredMedia.leader.photo} size={48} />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{leaderRoleLabel(featuredMedia.leader.role)}</p>
                    <p className="font-bold">{featuredMedia.leader.name}</p>
                  </div>
                </div>
              )}
              <Button className="mt-8" href={`/studios/${featured.slug}`}>Studio profile</Button>
            </div>
            <div className="space-y-3">
              {featuredGames.map((g) => (
                <Link key={g.slug} href={`/games/${g.slug}`} className="flex items-center gap-4 rounded-2xl bg-bg p-3 transition hover:shadow-lift">
                  <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="h-16 w-12 shrink-0 rounded-lg [&_p]:hidden" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{g.title}</p>
                    <p className="text-[12.5px] text-muted">{g.releaseDate.slice(0, 4)} · {g.engine}</p>
                  </div>
                  <div className="hidden gap-1.5 sm:flex">
                    {bestTestPerPlatform(testsOf(g)).slice(0, 3).map((t) => <PlatformBadge key={t.platform} id={t.platform} size="xs" />)}
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Numbers band */}
      <section className="mx-auto mt-24 max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 border-y border-line py-14 text-center sm:grid-cols-3">
          {[
            { v: cat.games.length, l: "Games catalogued" },
            { v: platforms.length, l: "Platforms & presets" },
            { v: cat.tests.length, l: "Performance entries" },
          ].map((s) => (
            <div key={s.l}>
              <Counter value={s.v} className="font-display text-[44px] font-bold md:text-[56px]" />
              <p className="mt-1 text-[14px] font-medium text-muted">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
