import Link from "next/link";
import { Logo } from "./navbar";
import { coverCount } from "@/lib/data/covers";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">Every game. Every platform. Every frame. A calm, precise reference for how games run across consoles, handhelds and PC.</p>
        </div>
        {[
          { h: "Explore", l: [["Games", "/games"], ["Compare", "/compare"], ["Platforms", "/platforms"], ["Studios", "/studios"]] },
          { h: "Tools", l: [["Can I Run It?", "/can-i-run"], ["AI Assistant", "/assistant"], ["Dashboard", "/dashboard"], ["Admin", "/admin"]] },
          { h: "Account", l: [["Sign in", "/login"], ["Saved builds", "/dashboard"], ["Submit a benchmark", "/dashboard#submit"]] },
        ].map((c) => (
          <div key={c.h}>
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted">{c.h}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.l.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-gold-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl space-y-2 px-6 py-6 text-[12.5px] leading-relaxed text-muted">
          <p>
            <strong className="font-medium text-ink">Data sources.</strong> Game metadata, credits and release dates are seeded from public information and are designed to be synced from IGDB/RAWG. PC requirements are seeded from publisher store listings. Performance figures marked <em>Demo data</em> are generated for demonstration and are not real measurements; verified figures carry a source link and a ✓ badge.
          </p>
          <p>All trademarks, platform names and game titles belong to their respective owners. FRAMEWISE is an independent reference and is not affiliated with Sony, Microsoft, Nintendo or Valve. {coverCount() > 0 ? <>Cover art courtesy of <a href="https://www.igdb.com" className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer noopener">IGDB.com</a>; games without a synced cover show generated art.</> : "Cover art is generated."}</p>
          <p>© FRAMEWISE</p>
        </div>
      </div>
    </footer>
  );
}
