"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "./ui";

export interface HeroSlide {
  slug: string;
  title: string;
  tagline: string;
  heroUrl: string;
  logoUrl?: string;
  /** small line above the headline, e.g. "Runs best on PS5 Pro" */
  eyebrow?: string;
}

const INTERVAL = 7000;

/** Full-bleed auto-advancing banner: game art, logo, headline and two pill buttons. */
export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const auto = playing && !reduced;
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => go(i + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [auto, i, go]);

  const s = slides[i];
  return (
    <section className="relative h-[560px] overflow-hidden bg-black text-white md:h-[640px]" aria-roledescription="carousel" aria-label="Featured games">
      <AnimatePresence initial={false}>
        <motion.div key={s.slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <Image src={s.heroUrl} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.72)_0%,rgba(0,0,0,.35)_45%,transparent_75%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-24 md:justify-center md:px-24 md:pb-0" aria-live={auto ? "off" : "polite"}>
        {/* keyed so each slide's copy fades in; no exit animation, so the text can never get stuck hidden */}
        <motion.div key={s.slug} initial={{ opacity: 0.001, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }} className="max-w-xl">
            {s.logoUrl ? (
              <div className="relative mb-6 h-24 w-full max-w-[380px] md:h-32">
                <Image src={s.logoUrl} alt={s.title} fill sizes="380px" className="object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,.5)]" />
              </div>
            ) : (
              <p className="mb-4 font-display text-4xl font-bold">{s.title}</p>
            )}
            {s.eyebrow && <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80">{s.eyebrow}</p>}
            <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.15] md:text-[44px]">{s.tagline}</h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" href={`/compare?game=${s.slug}`}>Compare platforms</Button>
              <Button variant="ghostLight" href={`/games/${s.slug}`}>Learn more</Button>
            </div>
        </motion.div>
      </div>

      {/* controls */}
      <button onClick={() => go(i - 1)} className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/55 md:grid" aria-label="Previous slide">
        <ChevronLeft size={24} />
      </button>
      <button onClick={() => go(i + 1)} className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/55 md:grid" aria-label="Next slide">
        <ChevronRight size={24} />
      </button>
      <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-3">
        {slides.map((x, n) => (
          <button key={x.slug} onClick={() => go(n)} className="group grid h-6 place-items-center" aria-label={`Show ${x.title}`} aria-current={n === i}>
            <span className={`block h-[3px] rounded-full transition-all duration-300 ${n === i ? "w-10 bg-white" : "w-5 bg-white/45 group-hover:bg-white/80"}`} />
          </button>
        ))}
        {!reduced && (
          <button onClick={() => setPlaying((p) => !p)} className="ml-2 grid h-7 w-7 place-items-center rounded-full border border-white/60 text-white hover:bg-white hover:text-black" aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
            {playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          </button>
        )}
      </div>
    </section>
  );
}
