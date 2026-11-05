import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/db";
import { CanIRun } from "@/components/can-i-run";
import { runGames } from "@/lib/lite";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Can I Run It?", description: "Estimate how every game in the catalog will run on your PC, with a clear confidence level." };

export default async function CanIRunPage() {
  const cat = await getCatalog();
  return (
    <div>
      <section className="hero-gradient -mt-[68px] pb-12 pt-[130px]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Can I run it?</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold md:text-6xl">Your build, every game.</h1>
          <p className="mt-4 max-w-xl text-muted">Enter your hardware once to see an expected preset, frame rate and confidence level for each title.</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <CanIRun games={runGames(cat)} requirements={cat.requirements} />
        </Suspense>
      </div>
    </div>
  );
}
