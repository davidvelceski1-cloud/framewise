"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useApp } from "./providers";

const CHIPS = ["open-world games at 30 fps+ on Steam Deck", "RPGs on Switch 2", "Unreal Engine 5 games", "60fps+ on console"];

export function HeroSearch() {
  const router = useRouter();
  const { openAssistant } = useApp();
  const [q, setQ] = useState("");
  const go = (s: string) => {
    const v = s.trim();
    if (!v) return router.push("/games");
    if (/\?$|^(can|where|how|which|is|does|what|compare)\b/i.test(v)) openAssistant(v);
    else router.push(`/games?q=${encodeURIComponent(v)}`);
  };
  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="glass hairline flex items-center gap-3 rounded-full p-2 pl-5 shadow-lift"
        role="search"
      >
        <Search size={18} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a game, or ask “Where does Elden Ring run best?”"
          className="h-11 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          aria-label="Search games or ask a question"
        />
        <button type="submit" className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-bg">
          <Sparkles size={15} className="text-gold" /> Search
        </button>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CHIPS.map((c) => (
          <button key={c} onClick={() => go(c)} className="hairline rounded-full bg-card/70 px-3.5 py-1.5 text-[12.5px] text-muted transition hover:text-ink">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
