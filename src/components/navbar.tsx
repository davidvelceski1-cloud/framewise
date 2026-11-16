"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, Moon, Search, Sparkles, Sun, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

const links = [
  { href: "/games", label: "Games" },
  { href: "/compare", label: "Compare" },
  { href: "/platforms", label: "Platforms" },
  { href: "/studios", label: "Studios" },
  { href: "/can-i-run", label: "Can I Run It?" },
  { href: "/assistant", label: "AI Assistant" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="FRAMEWISE home">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink">
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
          <path d="M2 12 L6 7 L9 9.5 L14 3" stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-display text-[19px] font-bold tracking-[0.06em]">FRAMEWISE</span>
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

const iconBtn = "grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface";

function NavbarInner({ pathname }: { pathname: string }) {
  const { user, theme, toggleTheme, openAssistant, setPaletteOpen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 bg-bg transition-shadow", scrolled && "shadow-[0_1px_0_var(--line)]")}>
      <nav className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-2 px-6 lg:px-10" aria-label="Main">
        <Logo />
        <ul className="ml-10 hidden h-full items-stretch gap-7 lg:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <li key={l.href} className="flex">
                <Link
                  href={l.href}
                  className={cn(
                    "relative flex items-center text-[14.5px] font-bold transition-colors after:absolute after:inset-x-0 after:bottom-4 after:h-[2px] after:origin-left after:bg-ink after:transition-transform",
                    active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={() => setPaletteOpen(true)} className={iconBtn} aria-label="Search (Ctrl+K)" title="Search  ·  Ctrl+K">
            <Search size={20} strokeWidth={2} />
          </button>
          <button onClick={() => openAssistant()} className={iconBtn} aria-label="Ask the AI assistant" title="Ask FRAMEWISE">
            <Sparkles size={20} strokeWidth={2} />
          </button>
          <button onClick={toggleTheme} className={iconBtn} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === "dark" ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          </button>
          {user ? (
            <Link href="/dashboard" className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-bold text-bg" aria-label="Your dashboard">
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className={iconBtn} aria-label="Sign in">
              <User size={20} strokeWidth={2} />
            </Link>
          )}
          <button className={cn(iconBtn, "lg:hidden")} onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-line bg-bg lg:hidden"
          >
            <div className="px-6 py-3">
              {[...links, { href: user ? "/dashboard" : "/login", label: user ? "Dashboard" : "Sign in" }].map((l) => (
                <Link key={l.href} href={l.href} className="block border-b border-line py-4 text-[17px] font-bold last:border-0" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
