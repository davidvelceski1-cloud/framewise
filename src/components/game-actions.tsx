"use client";

import { Bell, BellRing, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

export function GameActions({ slug, title }: { slug: string; title: string }) {
  const { user, data, update } = useApp();
  const router = useRouter();
  const fav = data.favorites.includes(slug);
  const alert = data.alerts.includes(slug);
  const guard = (fn: () => void) => () => (user ? fn() : router.push(`/login?next=/games/${slug}`));
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={guard(() => update((d) => ({ ...d, favorites: fav ? d.favorites.filter((x) => x !== slug) : [...d.favorites, slug] })))}
        aria-pressed={fav}
        className={cn("hairline flex h-10 items-center gap-2 rounded-full px-4 text-sm transition", fav ? "bg-ink text-bg" : "bg-card hover:shadow-soft")}
      >
        <Heart size={15} className={fav ? "fill-current text-gold" : ""} /> {fav ? "Favorited" : "Favorite"}
      </button>
      <button
        onClick={guard(() => update((d) => ({ ...d, alerts: alert ? d.alerts.filter((x) => x !== slug) : [...d.alerts, slug] })))}
        aria-pressed={alert}
        title={`Notify me when a performance patch drops for ${title}`}
        className={cn("hairline flex h-10 items-center gap-2 rounded-full px-4 text-sm transition", alert ? "bg-ink text-bg" : "bg-card hover:shadow-soft")}
      >
        {alert ? <BellRing size={15} className="text-gold" /> : <Bell size={15} />} {alert ? "Patch alerts on" : "Patch alerts"}
      </button>
    </div>
  );
}
