"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Command, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

const links = [
  { href: "/games", label: "Games" },
  { href: "/compare", label: "Compare" },
  { href: "/platforms", label: "Platforms" },
  { href: "/studios", label: "Studios" },
  { href: "/can-i-run", label: "Can I Run It?" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="FRAMEWISE home">
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-[#0E1116] ring-1 ring-white/10">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M2 12 L6 7 L9 9.5 L14 3" stroke="url(#fwg)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="fwg" x1="0" x2="1">
              <stop offset="0" stopColor="#E9D8B4" />
              <stop offset="1" stopColor="#C9A96E" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="font-display text-[15px] font-semibold tracking-[0.14em]">FRAMEWISE</span>
    </Link>
  );
}

/** Reads the URL, so it must sit under <Suspense> (Cache Components). */
function NavbarWithPath() {
  return <NavbarInner pathname={usePathname()} />;
}

export function Navbar() {
  // Fallback is the same bar without the active-link highlight.
  return (
    <Suspense fallback={<NavbarInner pathname="" />}>
      <NavbarWithPath />
    </Suspense>
  );
}

function NavbarInner({ pathname }: { pathname: string }) {
  const { user, theme, toggleTheme, openAssistant, setPaletteOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav
        className={cn(
          "glass mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-2xl px-3 transition-all duration-500 md:px-4",
          scrolled ? "hairline shadow-soft" : "border border-transparent",
        )}
        aria-label="Main"
      >
        <Logo />
        <ul className="ml-6 hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors",
                  pathname.startsWith(l.href) ? "bg-surface text-ink" : "text-muted hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hairline hidden h-9 items-center gap-2 rounded-full bg-card px-3 text-[13px] text-muted transition hover:text-ink md:flex"
            aria-label="Open search and commands"
          >
            Search
            <kbd className="flex items-center gap-0.5 rounded-md bg-surface px-1.5 py-0.5 text-[11px]">
              <Command size={11} />K
            </kbd>
          </button>
          <button
            onClick={() => openAssistant()}
            className="gold-gradient hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium sm:flex"
          >
            <Sparkles size={14} /> AI Assistant
          </button>
          <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label={theme === "dark" ? "Switch to Ivory (light) edition" : "Switch to Midnight (dark) edition"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <Link href="/dashboard" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-bg" aria-label="Your dashboard">
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="hidden h-9 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-bg sm:flex">
              Sign in
            </Link>
          )}
          <button className="grid h-9 w-9 place-items-center rounded-full lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass hairline mx-auto mt-2 max-w-7xl rounded-2xl p-2 shadow-lift lg:hidden"
          >
            {[...links, { href: user ? "/dashboard" : "/login", label: user ? "Dashboard" : "Sign in" }].map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-[15px] hover:bg-surface" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { setOpen(false); openAssistant(); }} className="block w-full rounded-xl px-4 py-3 text-left text-[15px] text-gold-ink hover:bg-surface">
              ✦ AI Assistant
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
