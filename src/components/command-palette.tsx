"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, Cpu, Gamepad2, Moon, Search, Sparkles } from "lucide-react";
import { useApp } from "./providers";
import { platforms } from "@/lib/platforms";
import type { SearchIndex } from "@/lib/db";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  group: string;
}

export function CommandPalette({ index }: { index: SearchIndex }) {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen, openAssistant, toggleTheme } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Every close path resets the query, so the palette always reopens clean.
  const close = useCallback(() => {
    setPaletteOpen(false);
    setQ("");
    setActive(0);
  }, [setPaletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (paletteOpen) close();
        else setPaletteOpen(true);
      }
      if (e.key === "Escape" && paletteOpen) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen, close]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };
    const s = q.trim().toLowerCase();
    const games = index
      .filter((g) => !s || g.title.toLowerCase().includes(s) || g.genres.some((x) => x.toLowerCase().includes(s)))
      .slice(0, s ? 6 : 4)
      .flatMap((g) => [
        { id: `g-${g.slug}`, label: g.title, hint: g.year, icon: <Gamepad2 size={15} />, run: go(`/games/${g.slug}`), group: "Games" },
        ...(s ? [{ id: `c-${g.slug}`, label: `Compare ${g.title} across platforms`, icon: <BarChart3 size={15} />, run: go(`/compare?game=${g.slug}`), group: "Compare" }] : []),
      ]);
    const plats = platforms
      .filter((p) => s && (p.name.toLowerCase().includes(s) || p.short.toLowerCase().includes(s)))
      .map((p) => ({ id: `p-${p.id}`, label: p.name, hint: "Platform", icon: <Cpu size={15} />, run: go(`/platforms/${p.slug}`), group: "Platforms" }));
    const pages: Item[] = [
      { id: "n-compare", label: "Open the Comparator", icon: <BarChart3 size={15} />, run: go("/compare"), group: "Navigate" },
      { id: "n-games", label: "Browse all games", icon: <Gamepad2 size={15} />, run: go("/games"), group: "Navigate" },
      { id: "n-run", label: "Can I run it?", icon: <Cpu size={15} />, run: go("/can-i-run"), group: "Navigate" },
      { id: "n-theme", label: "Toggle Midnight Edition", icon: <Moon size={15} />, run: () => { toggleTheme(); close(); }, group: "Navigate" },
    ].filter((i) => !s || i.label.toLowerCase().includes(s));
    const ai: Item[] = s
      ? [
          { id: "ai", label: `Ask AI: “${q.trim()}”`, icon: <Sparkles size={15} />, run: () => { close(); openAssistant(q.trim()); }, group: "AI Assistant" },
          { id: "nl", label: `Search games: “${q.trim()}”`, icon: <Search size={15} />, run: go(`/games?q=${encodeURIComponent(q.trim())}`), group: "AI Assistant" },
        ]
      : [{ id: "ai", label: "Ask the AI Assistant…", icon: <Sparkles size={15} />, run: () => { close(); openAssistant(); }, group: "AI Assistant" }];
    return [...(s.split(" ").length > 2 ? [...ai, ...games] : [...games, ...ai]), ...plats, ...pages];
  }, [q, index, router, close, openAssistant, toggleTheme]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[12vh] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="glass hairline w-full max-w-xl overflow-hidden rounded-3xl shadow-lift"
            initial={{ y: 12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={17} className="text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                  if (e.key === "Enter") items[active]?.run();
                }}
                placeholder="Search games, platforms, or ask a question…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
                aria-activedescendant={items[active] ? `cmdk-${items[active].id}` : undefined}
              />
              <kbd className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] text-muted">esc</kbd>
            </div>
            <div ref={listRef} id="cmdk-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Nothing found.</p>}
              {groups.map((g) => (
                <div key={g} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{g}</p>
                  {items.map((it, idx) =>
                    it.group !== g ? null : (
                      <button
                        key={it.id}
                        id={`cmdk-${it.id}`}
                        role="option"
                        aria-selected={idx === active}
                        data-idx={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={it.run}
                        className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px]", idx === active ? "bg-surface" : "")}
                      >
                        <span className={cn("text-muted", it.group === "AI Assistant" && "text-gold-ink")}>{it.icon}</span>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.hint && <span className="tabular text-xs text-muted">{it.hint}</span>}
                        {idx === active && <ArrowRight size={14} className="text-muted" />}
                      </button>
                    ),
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
