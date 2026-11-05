import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/db";
import { Reveal } from "@/components/ui";

export const metadata: Metadata = { title: "Studios & Publishers" };

export default async function StudiosPage() {
  const cat = await getCatalog();
  const withCount = cat.studios
    .map((s) => ({ s, n: cat.games.filter((g) => g.developers.includes(s.slug) || g.publishers.includes(s.slug)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => a.s.name.localeCompare(b.s.name));
  return (
    <div>
      <section className="hero-gradient -mt-[68px] pb-12 pt-[130px]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Studios & publishers</p>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-6xl">The people behind the frames.</h1>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {withCount.map(({ s, n }, i) => (
          <Reveal key={s.slug} delay={(i % 6) * 0.04}>
            <Link href={`/studios/${s.slug}`} className="card lift flex items-center gap-4 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-[15px] font-semibold" style={{ background: `linear-gradient(140deg, ${s.colors[0]}, #0E1116)`, color: s.colors[1] }} aria-hidden>{s.monogram}</span>
              <div className="min-w-0">
                <p className="truncate font-display text-[17px] font-semibold">{s.name}</p>
                <p className="text-[12.5px] text-muted">{s.kind === "both" ? "Developer & publisher" : s.kind === "studio" ? "Developer" : "Publisher"}{s.hq ? ` · ${s.hq.split(",").pop()?.trim()}` : ""}</p>
                <p className="tabular mt-1 text-[12px] text-muted">{n} game{n > 1 ? "s" : ""}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
