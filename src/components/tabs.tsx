"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const uid = useId();
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div>
      <div role="tablist" aria-label="Game sections" className="no-scrollbar hairline sticky top-[76px] z-20 flex gap-1 overflow-x-auto rounded-full bg-card/80 p-1 backdrop-blur-md">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length].id);
              if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length].id);
            }}
            className={cn("relative h-9 shrink-0 rounded-full px-4 text-[13.5px] transition-colors", active === t.id ? "text-bg" : "text-muted hover:text-ink")}
          >
            {active === t.id && <motion.span layoutId={`${uid}-pill`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${uid}-panel-${t.id}`} aria-labelledby={`${uid}-tab-${t.id}`} hidden={active !== t.id} className="pt-10">
          {active === t.id && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}>
              {t.content}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
