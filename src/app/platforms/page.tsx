import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCatalog } from "@/lib/db";
import { families, familyOrder, platforms } from "@/lib/platforms";
import { Reveal } from "@/components/ui";

export const metadata: Metadata = { title: "Platforms", description: "Hardware specs and top-performing games for every console, handheld and PC preset." };

export default async function PlatformsPage() {
  const cat = await getCatalog();
  return (
    <div>
      <section className="hero-gradient -mt-[68px] pb-12 pt-[130px]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Platforms</p>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-6xl">Every machine, measured.</h1>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-14 px-6">
        {familyOrder.map((f) => {
          const fam = families[f];
          return (
            <section key={f}>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: fam.primary }} />
                <h2 className="font-display text-2xl font-semibold">{fam.name}</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {platforms.filter((p) => p.family === f).map((p, i) => {
                  const n = new Set(cat.tests.filter((t) => t.platform === p.id).map((t) => t.gameSlug)).size;
                  return (
                    <Reveal key={p.id} delay={i * 0.05}>
                      <Link href={`/platforms/${p.slug}`} className="card lift group block overflow-hidden">
                        <div className="relative h-28 p-5 text-white" style={{ background: `linear-gradient(135deg, ${fam.gradient[0]}, ${fam.gradient[1]})` }}>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/75">{fam.name}</p>
                          <p className="mt-1 font-display text-2xl font-semibold">{p.short}</p>
                        </div>
                        <div className="p-5">
                          <p className="text-[13.5px] text-muted">{p.blurb}</p>
                          <p className="tabular mt-4 text-[12.5px] text-muted">{p.hardware.gpu}</p>
                          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[13px]">
                            <span><span className="tabular">{n}</span> games benchmarked</span>
                            <ArrowRight size={15} className="text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
