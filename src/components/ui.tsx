"use client";

import Link from "next/link";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { families, platformById, releasePlatformMeta } from "@/lib/platforms";
import type { PlatformFamily, PlatformId, ReleasePlatform } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ───────── Button ───────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
};
export function Button({ variant = "primary", size = "md", className, href, children, ...rest }: BtnProps) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    size === "sm" && "h-8 px-3.5 text-[13px]",
    size === "md" && "h-10 px-5 text-sm",
    size === "lg" && "h-12 px-7 text-[15px]",
    variant === "primary" && "bg-ink text-bg hover:opacity-90 shadow-soft",
    variant === "gold" && "gold-gradient shadow-soft hover:brightness-105",
    variant === "ghost" && "text-ink hover:bg-surface",
    variant === "outline" && "hairline bg-card text-ink hover:border-line-strong hover:shadow-soft",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ───────── Platform badges (color + text, never color alone) ───────── */
export function PlatformBadge({ id, size = "sm", className }: { id: PlatformId; size?: "xs" | "sm"; className?: string }) {
  const p = platformById[id];
  const f = families[p.family];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight",
        size === "xs" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        className,
      )}
      style={{ background: f.badgeBg, color: f.badgeFg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.family === "steamdeck" ? f.primary : f.gradient[1] }} aria-hidden />
      {p.short}
    </span>
  );
}

export function ReleaseBadge({ platform, edition }: { platform: ReleasePlatform; edition?: string }) {
  const m = releasePlatformMeta[platform];
  const f = families[m.family];
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium" style={{ background: f.badgeBg, color: f.badgeFg }} title={edition}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.family === "steamdeck" ? f.primary : f.gradient[1] }} aria-hidden />
      {m.label}
    </span>
  );
}

export function FamilyDot({ family }: { family: PlatformFamily }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: families[family].primary }} aria-hidden />;
}

/* ───────── Generic badges ───────── */
export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "gold" | "demo" | "ok" | "warn"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-medium",
        tone === "neutral" && "hairline bg-surface text-muted",
        tone === "gold" && "gold-gradient",
        tone === "demo" && "border border-dashed border-line-strong text-muted",
        tone === "ok" && "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300",
        tone === "warn" && "bg-amber-500/15 text-amber-900 dark:text-amber-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SourceBadge({ verified, demo, label }: { verified: boolean; demo: boolean; label: string }) {
  if (verified) return <Pill tone="ok">✓ Verified · {label}</Pill>;
  if (demo) return <Pill tone="demo">Demo data</Pill>;
  return <Pill tone="warn">Unverified · {label}</Pill>;
}

/* ───────── Cover art: real cover when available, generated art otherwise ───────── */
const IGDB_HOST = "images.igdb.com";

function CoverImage({ src, title, size, onFail }: { src: string; title: string; size: "sm" | "md" | "lg"; onFail: () => void }) {
  // smaller thumbnails use IGDB's 264px rendition instead of the 2x one
  const url = size === "sm" ? src.replace("/t_cover_big_2x/", "/t_cover_big/") : src;
  const sizes = size === "lg" ? "300px" : size === "md" ? "(max-width: 640px) 100vw, 400px" : "120px";
  const optimizable = url.startsWith("/") || new URL(url).hostname === IGDB_HOST;
  if (!optimizable) {
    // admin-entered URLs on other hosts aren't in images.remotePatterns, so use a plain lazy image
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" loading="lazy" onError={onFail} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`${title} cover art`} className="absolute inset-0 h-full w-full object-contain" loading="lazy" onError={onFail} />
      </>
    );
  }
  return (
    <>
      {/* blurred copy fills landscape slots so portrait box art never looks letterboxed */}
      <Image src={url} alt="" aria-hidden fill sizes={sizes} className="scale-110 object-cover opacity-60 blur-xl" onError={onFail} />
      <Image src={url} alt={`${title} cover art`} fill sizes={sizes} className="object-contain" onError={onFail} preload={size === "lg"} />
    </>
  );
}

export function GameCover({ title, cover, image, className, size = "md" }: { title: string; cover: [string, string, string]; image?: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const [a, b, c] = cover;
  const words = title.replace(/[:]/g, "").split(" ");
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = Boolean(image) && failed !== image;
  return (
    <div
      className={cn("relative overflow-hidden rounded-[18px]", className)}
      style={{ background: `linear-gradient(150deg, ${a} 0%, ${a} 35%, ${c} 100%)` }}
      {...(showImage ? {} : { role: "img", "aria-label": `${title} cover art (generated)` })}
    >
      {showImage ? (
        <CoverImage src={image!} title={title} size={size} onFail={() => setFailed(image!)} />
      ) : (
        <>
          <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(120% 70% at 85% 0%, ${b}55, transparent 55%), radial-gradient(90% 60% at 0% 100%, ${c}aa, transparent 60%)` }} />
          <svg className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden>
            <path d="M0 110 L20 85 L35 98 L55 70 L72 90 L100 60 L100 140 L0 140 Z" fill={b} />
            <circle cx="76" cy="34" r="16" fill="none" stroke={b} strokeWidth="0.6" />
            <circle cx="76" cy="34" r="24" fill="none" stroke={b} strokeWidth="0.3" />
          </svg>
          <div className={cn("absolute inset-x-0 bottom-0 p-3", size === "lg" && "p-5")}>
            <div className="mb-2 h-px w-8" style={{ background: b }} />
            <p
              className={cn("font-display font-semibold leading-[1.05] text-white", size === "sm" && "text-[13px]", size === "md" && "text-base", size === "lg" && "text-2xl")}
              style={{ textShadow: "0 1px 12px rgba(0,0,0,.35)" }}
            >
              {words.slice(0, 6).join(" ")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ───────── Motion helpers ───────── */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ value, decimals = 0, className, suffix }: { value: number; decimals?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals) + (suffix ?? ""));
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.1, ease: [0.2, 0.7, 0.2, 1] });
    return () => c.stop();
  }, [inView, value, mv]);
  return <motion.span ref={ref} className={cn("tabular", className)}>{text}</motion.span>;
}

/* ───────── Layout helpers ───────── */
export function SectionHeader({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-semibold md:text-[40px] md:leading-[1.1]">{title}</h2>
        {desc && <p className="mt-3 text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} aria-hidden />;
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <svg width="120" height="84" viewBox="0 0 120 84" fill="none" aria-hidden className="mb-5">
        <rect x="10" y="14" width="100" height="62" rx="14" fill="var(--surface)" stroke="var(--line-strong)" />
        <rect x="22" y="48" width="10" height="18" rx="3" fill="var(--gold-soft)" />
        <rect x="38" y="38" width="10" height="28" rx="3" fill="var(--gold)" opacity=".7" />
        <rect x="54" y="28" width="10" height="38" rx="3" fill="var(--gold)" />
        <rect x="70" y="42" width="10" height="24" rx="3" fill="var(--line-strong)" />
        <circle cx="94" cy="20" r="12" fill="var(--card)" stroke="var(--line-strong)" />
        <path d="M89 20h10M94 15v10" stroke="var(--gold-ink)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="font-display text-lg font-semibold">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-[15px] font-medium">{children}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
