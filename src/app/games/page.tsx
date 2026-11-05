import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/db";
import { GamesBrowser } from "@/components/games-browser";
import { browseData } from "@/lib/lite";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Games", description: "Browse every game by platform, genre, publisher, engine, year and performance." };

export default async function GamesPage() {
  const catalog = await getCatalog();
  return (
    <div>
      <section className="hero-gradient -mt-[68px] pb-12 pt-[130px]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Encyclopedia</p>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-6xl">Games</h1>
          <p className="mt-4 max-w-xl text-muted">Filter by platform, genre, publisher, engine or performance, or describe what you want in plain language.</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6">
        <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>}>
          <GamesBrowser catalog={browseData(catalog)} />
        </Suspense>
      </div>
    </div>
  );
}
