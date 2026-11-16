"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { motion } from "framer-motion";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, GameCover } from "./ui";

export type ShowcaseGame = Pick<Game, "slug" | "title" | "cover" | "coverUrl" | "heroUrl" | "logoUrl" | "genres" | "releaseDate" | "criticScore"> & {
  /** e.g. "Best on PS5 Pro · 60 fps" */
  best?: string;
};

/** Centered text tabs over a product-style grid: one large featured tile plus four cards. */
export function ShowcaseTabs({ tabs }: { tabs: { id: string; label: string; games: ShowcaseGame[] }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const uid = useId();
  const games = tabs.find((t) => t.id === active)!.games;
  const [lead, ...rest] = games;

  return (
    <div>
      <div role="tablist" aria-label="Game collections" className="no-scrollbar mb-10 flex justify-center gap-8 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel`}
            onClick={() => setActive(t.id)}
            className={cn("relative shrink-0 pb-3 text-[16px] transition-colors", active === t.id ? "font-bold text-ink" : "font-medium text-muted hover:text-ink")}
          >
            {t.label}
            {active === t.id && <motion.span layoutId={`${uid}-bar`} className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-ink" />}
          </button>
        ))}
      </div>

      <motion.div key={active} id={`${uid}-panel`} role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        {lead && (
          <Link href={`/games/${lead.slug}`} className="lift group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[20px] bg-black p-8 text-white md:col-span-2 lg:row-span-2">
            {lead.heroUrl && <Image src={lead.heroUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-90" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="relative">
              {lead.logoUrl ? (
                <div className="relative mb-4 h-20 w-64">
                  <Image src={lead.logoUrl} alt={lead.title} fill sizes="256px" className="object-contain object-left" />
                </div>
              ) : (
                <p className="mb-3 font-display text-3xl font-bold">{lead.title}</p>
              )}
              <p className="text-[14px] text-white/80">{lead.releaseDate.slice(0, 4)} · {lead.genres.join(" · ")}</p>
              {lead.best && <p className="mt-1 text-[14px] font-semibold">{lead.best}</p>}
              <span className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-6 text-[13.5px] font-semibold text-black">Learn more</span>
            </div>
          </Link>
        )}
        {rest.slice(0, 4).map((g) => (
          <div key={g.slug} className="card group flex flex-col p-5">
            <Link href={`/games/${g.slug}`} className="block" tabIndex={-1} aria-hidden>
              <GameCover title={g.title} cover={g.cover} image={g.coverUrl} size="sm" className="mx-auto aspect-[3/4] w-[58%] max-w-[190px] rounded-xl shadow-lift transition duration-500 group-hover:scale-[1.03]" />
            </Link>
            <Link href={`/games/${g.slug}`} className="mt-5 line-clamp-2 font-display text-[16px] font-bold leading-snug hover:underline">
              {g.title}
            </Link>
            <p className="mt-1 text-[13px] text-muted">{g.releaseDate.slice(0, 4)} · {g.genres.slice(0, 2).join(" · ")}</p>
            {g.best && <p className="mt-2 text-[13px] font-semibold">{g.best}</p>}
            <div className="mt-auto flex gap-2 pt-4">
              <Button size="sm" href={`/compare?game=${g.slug}`}>Compare</Button>
              <Button size="sm" variant="outline" href={`/games/${g.slug}`}>Learn more</Button>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
