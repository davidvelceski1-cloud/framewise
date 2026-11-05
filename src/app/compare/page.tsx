import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/db";
import { Comparator } from "@/components/comparator";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cross-Platform Comparator",
  description: "Compare any game across PS5, Xbox Series X|S, Switch, Steam Deck and PC: fps, resolution, upscaling, ray tracing and load times.",
};

export default async function ComparePage() {
  const cat = await getCatalog();
  const games = cat.games.map(({ slug, title, cover, coverUrl, releaseDate, genres }) => ({ slug, title, cover, coverUrl, releaseDate, genres }));
  return (
    <div>
      <section className="hero-gradient -mt-[68px] pb-10 pt-[130px]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">The Comparator</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">One game. Every platform. Side by side.</h1>
          <p className="mt-4 max-w-xl text-muted">Pick a game, choose platforms and modes, and see exactly where it runs best.</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6">
        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-96 w-full" /></div>}>
          <Comparator games={games} />
        </Suspense>
      </div>
    </div>
  );
}
